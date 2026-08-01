// OAuth Service
// Service layer for OAuth 2.0 integration framework

import { supabase } from '@/integrations/supabase/client';
import type { OAuthToken } from '@/types/phase2';

export interface OAuthConfig {
  client_id: string;
  client_secret: string;
  authorization_url: string;
  token_url: string;
  scope: string[];
  redirect_uri: string;
}

export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in?: number;
  scope?: string[];
}

export class OAuthService {
  private readonly ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default-encryption-key';

  /**
   * Generate OAuth authorization URL
   */
  generateAuthorizationUrl(
    config: OAuthConfig,
    state: string,
    additionalParams?: Record<string, string>
  ): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.client_id,
      redirect_uri: config.redirect_uri,
      scope: config.scope.join(' '),
      state,
      ...additionalParams
    });

    return `${config.authorization_url}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    config: OAuthConfig,
    code: string
  ): Promise<OAuthTokenResponse> {
    try {
      const response = await fetch(config.token_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: config.client_id,
          client_secret: config.client_secret,
          redirect_uri: config.redirect_uri
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token exchange failed: ${error}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw new Error('Failed to exchange authorization code for token');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(
    config: OAuthConfig,
    refreshToken: string
  ): Promise<OAuthTokenResponse> {
    try {
      const response = await fetch(config.token_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: config.client_id,
          client_secret: config.client_secret
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token refresh failed: ${error}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Store OAuth token securely
   */
  async storeOAuthToken(
    instanceId: string,
    userId: string,
    tokenResponse: OAuthTokenResponse
  ): Promise<void> {
    try {
      const expiresAt = tokenResponse.expires_in
        ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
        : null;

      const { error } = await supabase
        .from('oauth_tokens' as any)
        .insert({
          integration_instance_id: instanceId,
          user_id: userId,
          access_token: await this.encrypt(tokenResponse.access_token),
          refresh_token: tokenResponse.refresh_token 
            ? await this.encrypt(tokenResponse.refresh_token)
            : null,
          token_type: tokenResponse.token_type || 'Bearer',
          expires_at: expiresAt,
          scope: tokenResponse.scope || []
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error storing OAuth token:', error);
      throw new Error('Failed to store OAuth token');
    }
  }

  /**
   * Get OAuth token for an instance
   */
  async getOAuthToken(instanceId: string, userId: string): Promise<OAuthToken | null> {
    try {
      const { data, error } = await supabase
        .from('oauth_tokens' as any)
        .select('*')
        .eq('integration_instance_id', instanceId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      // Decrypt tokens
      if (data && typeof data === 'object') {
        const dataObj = data as any;
        const decryptedAccessToken = await this.decrypt(dataObj.access_token);
        const decryptedRefreshToken = dataObj.refresh_token ? await this.decrypt(dataObj.refresh_token) : undefined;
        
        return {
          ...dataObj,
          access_token: decryptedAccessToken,
          refresh_token: decryptedRefreshToken
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting OAuth token:', error);
      return null;
    }
  }

  /**
   * Check if token needs refresh
   */
  needsRefresh(token: OAuthToken): boolean {
    if (!token.expires_at) return false;
    
    const expiresAt = new Date(token.expires_at);
    const now = new Date();
    const fiveMinutes = 5 * 60 * 1000;
    
    return expiresAt.getTime() - now.getTime() < fiveMinutes;
  }

  /**
   * Refresh token if needed
   */
  async refreshIfNeeded(
    instanceId: string,
    userId: string,
    config: OAuthConfig
  ): Promise<string> {
    try {
      const token = await this.getOAuthToken(instanceId, userId);
      
      if (!token) {
        throw new Error('No OAuth token found');
      }

      if (!this.needsRefresh(token)) {
        return token.access_token;
      }

      if (!token.refresh_token) {
        throw new Error('No refresh token available');
      }

      // Refresh the token
      const tokenResponse = await this.refreshAccessToken(
        config,
        token.refresh_token
      );

      // Update stored token
      await supabase
        .from('oauth_tokens' as any)
        .update({
          access_token: await this.encrypt(tokenResponse.access_token),
          refresh_token: tokenResponse.refresh_token
            ? await this.encrypt(tokenResponse.refresh_token)
            : await this.encrypt(token.refresh_token),
          expires_at: tokenResponse.expires_in
            ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
            : token.expires_at,
          updated_at: new Date().toISOString()
        })
        .eq('id', (token as any).id);

      return tokenResponse.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh OAuth token');
    }
  }

  /**
   * Revoke OAuth token
   */
  async revokeOAuthToken(instanceId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('oauth_tokens' as any)
        .delete()
        .eq('integration_instance_id', instanceId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error revoking OAuth token:', error);
      throw new Error('Failed to revoke OAuth token');
    }
  }

  /**
   * Generate secure state parameter
   */
  async generateState(): Promise<string> {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    const userId = await this.getUserId();
    
    return btoa(`${timestamp}:${random}:${userId}`);
  }

  /**
   * Validate state parameter
   */
  async validateState(state: string): Promise<boolean> {
    try {
      const decoded = atob(state);
      const parts = decoded.split(':');
      
      if (parts.length !== 3) return false;
      
      const timestamp = parseInt(parts[0], 36);
      const userId = parts[2];
      
      // Check if state is not too old (5 minutes)
      const age = Date.now() - timestamp;
      if (age > 5 * 60 * 1000) return false;
      
      // Check if user ID matches
      const currentUserId = await this.getUserId();
      if (userId !== currentUserId) return false;
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  private async encrypt(data: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const dataBytes = encoder.encode(data);
      
      // Generate a random IV (Initialization Vector)
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Derive a key from the encryption key
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(this.ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)),
        'PBKDF2',
        false,
        ['deriveKey']
      );
      
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: new TextEncoder().encode('gesclic-oauth-salt'),
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );
      
      // Encrypt the data
      const encryptedBytes = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        dataBytes
      );
      
      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedBytes.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedBytes), iv.length);
      
      // Convert to base64 for storage
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  private async decrypt(encryptedData: string): Promise<string> {
    try {
      // Convert from base64
      const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
      
      // Extract IV (first 12 bytes)
      const iv = combined.slice(0, 12);
      const encryptedBytes = combined.slice(12);
      
      // Derive the same key
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(this.ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)),
        'PBKDF2',
        false,
        ['deriveKey']
      );
      
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: new TextEncoder().encode('gesclic-oauth-salt'),
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );
      
      // Decrypt the data
      const decryptedBytes = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encryptedBytes
      );
      
      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBytes);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Get current user ID
   */
  private async getUserId(): Promise<string> {
    const { data } = await supabase.auth.getUser();
    return data.user?.id || 'anonymous';
  }

  /**
   * Make authenticated API request using OAuth token
   */
  async makeAuthenticatedRequest<T>(
    url: string,
    token: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error making authenticated request:', error);
      throw new Error('Failed to make authenticated API request');
    }
  }
}

// Export singleton instance
export const oauthService = new OAuthService();

// Pre-configured OAuth providers
export const OAuthProviders = {
  google: {
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
    authorization_url: 'https://accounts.google.com/o/oauth2/v2/auth',
    token_url: 'https://oauth2.googleapis.com/token',
    scope: ['openid', 'profile', 'email'],
    redirect_uri: `${window.location.origin}/oauth/callback`
  },
  microsoft: {
    client_id: import.meta.env.VITE_MICROSOFT_CLIENT_ID || '',
    client_secret: import.meta.env.VITE_MICROSOFT_CLIENT_SECRET || '',
    authorization_url: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    token_url: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scope: ['openid', 'profile', 'email'],
    redirect_uri: `${window.location.origin}/oauth/callback`
  },
  salesforce: {
    client_id: import.meta.env.VITE_SALESFORCE_CLIENT_ID || '',
    client_secret: import.meta.env.VITE_SALESFORCE_CLIENT_SECRET || '',
    authorization_url: 'https://login.salesforce.com/services/oauth2/authorize',
    token_url: 'https://login.salesforce.com/services/oauth2/token',
    scope: ['api', 'refresh_token', 'offline_access'],
    redirect_uri: `${window.location.origin}/oauth/callback`
  }
};
