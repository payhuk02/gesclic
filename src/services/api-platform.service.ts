// API Platform Service
// Service layer for REST API functionality

import { supabase } from '@/integrations/supabase/client';
import type { 
  APIKey, 
  APIRequestLog, 
  WebhookSubscription,
  PaginatedResponse 
} from '@/types/phase2';

export class APIPlatformService {
  /**
   * Generate API key for user
   */
  async generateAPIKey(
    userId: string,
    clinicId: string,
    name: string,
    scopes: string[] = [],
    rateLimitTier: 'free' | 'basic' | 'pro' | 'enterprise' = 'basic'
  ): Promise<{ apiKey: string; keyId: string }> {
    try {
      // Generate API key via database function
      const { data, error } = await supabase.rpc('generate_api_key');
      
      if (error) throw error;
      
      const apiKey = data;
      const keyPrefix = apiKey.split('_')[0] + '_' + apiKey.split('_')[1];
      
      // Hash the key for storage
      const { data: hashData } = await supabase.rpc('hash_api_key', {
        api_key: apiKey
      });
      
      // Store API key metadata
      const { data: keyRecord, error: insertError } = await supabase
        .from('api_keys')
        .insert({
          user_id: userId,
          clinic_id: clinicId,
          key_prefix: keyPrefix,
          key_hash: hashData,
          name,
          scopes,
          rate_limit_tier: rateLimitTier,
          requests_per_minute: this.getRateLimit(rateLimitTier),
          requests_per_day: this.getDailyRateLimit(rateLimitTier),
          is_active: true
        })
        .select('id')
        .single();
      
      if (insertError) throw insertError;
      
      return {
        apiKey,
        keyId: keyRecord.id
      };
    } catch (error) {
      console.error('Error generating API key:', error);
      throw new Error('Failed to generate API key');
    }
  }

  /**
   * Get API keys for user
   */
  async getAPIKeys(userId: string): Promise<APIKey[]> {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting API keys:', error);
      return [];
    }
  }

  /**
   * Get API keys for clinic
   */
  async getClinicAPIKeys(clinicId: string): Promise<APIKey[]> {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting clinic API keys:', error);
      return [];
    }
  }

  /**
   * Get single API key by ID
   */
  async getAPIKey(keyId: string): Promise<APIKey | null> {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('id', keyId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting API key:', error);
      return null;
    }
  }

  /**
   * Delete API key
   */
  async deleteAPIKey(keyId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting API key:', error);
      throw new Error('Failed to delete API key');
    }
  }

  /**
   * Toggle API key active status
   */
  async toggleAPIKey(keyId: string, isActive: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', keyId);

      if (error) throw error;
    } catch (error) {
      console.error('Error toggling API key:', error);
      throw new Error('Failed to toggle API key');
    }
  }

  /**
   * Update API key scopes
   */
  async updateAPIKeyScopes(keyId: string, scopes: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({
          scopes,
          updated_at: new Date().toISOString()
        })
        .eq('id', keyId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating API key scopes:', error);
      throw new Error('Failed to update API key scopes');
    }
  }

  /**
   * Validate API key
   */
  async validateAPIKey(apiKey: string): Promise<{
    valid: boolean;
    apiKeyId?: string;
    userId?: string;
    clinicId?: string;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc('validate_api_key', {
        api_key_param: apiKey
      });

      if (error) throw error;

      const result = data[0];
      
      if (!result.is_valid) {
        return { valid: false, error: 'Invalid API key' };
      }

      if (!result.is_active) {
        return { valid: false, error: 'API key is inactive' };
      }

      if (result.is_expired) {
        return { valid: false, error: 'API key has expired' };
      }

      return {
        valid: true,
        apiKeyId: result.api_key_id,
        userId: result.user_id,
        clinicId: result.clinic_id
      };
    } catch (error) {
      console.error('Error validating API key:', error);
      return { valid: false, error: 'Validation failed' };
    }
  }

  /**
   * Check rate limit for API key
   */
  async checkRateLimit(apiKeyId: string): Promise<{
    allowed: boolean;
    remaining: number;
    reset: Date;
  }> {
    try {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        api_key_id: apiKeyId,
        window_minutes: 1
      });

      if (error) throw error;

      const apiKey = await this.getAPIKey(apiKeyId);
      const maxRequests = apiKey?.requests_per_minute || 60;

      // Get current count
      const windowStart = new Date();
      windowStart.setMinutes(windowStart.getMinutes() - 1);
      
      const { count } = await supabase
        .from('rate_limit_tracking')
        .select('*', { count: 'exact', head: true })
        .eq('api_key_id', apiKeyId)
        .gte('window_start', windowStart.toISOString());

      const used = count || 0;
      const remaining = Math.max(0, maxRequests - used);
      const reset = new Date();
      reset.setMinutes(reset.getMinutes() + 1);

      return {
        allowed: data,
        remaining,
        reset
      };
    } catch (error) {
      console.error('Error checking rate limit:', error);
      return {
        allowed: false,
        remaining: 0,
        reset: new Date(Date.now() + 60000)
      };
    }
  }

  /**
   * Log API request
   */
  async logAPIRequest(
    apiKeyId: string,
    method: string,
    path: string,
    statusCode: number,
    responseTimeMs: number,
    queryParams?: Record<string, any>,
    requestBody?: Record<string, any>,
    responseBody?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('log_api_request', {
        p_api_key_id: apiKeyId,
        p_method: method,
        p_path: path,
        p_query_params: queryParams || {},
        p_request_body: requestBody || {},
        p_status_code: statusCode,
        p_response_body: responseBody || {},
        p_response_time_ms: responseTimeMs,
        p_ip_address: ipAddress,
        p_user_agent: userAgent
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error logging API request:', error);
      throw new Error('Failed to log API request');
    }
  }

  /**
   * Get API request logs
   */
  async getAPIRequestLogs(
    apiKeyId: string,
    page: number = 1,
    perPage: number = 50
  ): Promise<PaginatedResponse<APIRequestLog>> {
    try {
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      const { data, error, count } = await supabase
        .from('api_request_logs')
        .select('*', { count: 'exact' })
        .eq('api_key_id', apiKeyId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        page,
        per_page: perPage,
        total_pages: Math.ceil((count || 0) / perPage)
      };
    } catch (error) {
      console.error('Error getting API request logs:', error);
      throw new Error('Failed to get API request logs');
    }
  }

  /**
   * Get API usage summary
   */
  async getAPIUsageSummary(apiKeyId: string, days: number = 30): Promise<{
    total_requests: number;
    avg_response_time: number;
    success_rate: number;
    unique_ips: number;
  }> {
    try {
      const { data, error } = await supabase.rpc('get_api_usage_summary', {
        api_key_id_param: apiKeyId,
        days
      });

      if (error) throw error;

      const result = data[0];
      return {
        total_requests: Number(result.total_requests) || 0,
        avg_response_time: Number(result.avg_response_time) || 0,
        success_rate: Number(result.success_rate) || 0,
        unique_ips: Number(result.unique_ips) || 0
      };
    } catch (error) {
      console.error('Error getting API usage summary:', error);
      return {
        total_requests: 0,
        avg_response_time: 0,
        success_rate: 0,
        unique_ips: 0
      };
    }
  }

  /**
   * Refresh API usage analytics
   */
  async refreshAPIUsageAnalytics(): Promise<void> {
    try {
      const { error } = await supabase.rpc('refresh_api_usage_analytics');
      if (error) throw error;
    } catch (error) {
      console.error('Error refreshing API usage analytics:', error);
      throw new Error('Failed to refresh API usage analytics');
    }
  }

  // ============================================================================
  // WEBHOOK SUBSCRIPTIONS
  // ============================================================================

  /**
   * Create webhook subscription
   */
  async createWebhookSubscription(
    userId: string,
    clinicId: string,
    name: string,
    url: string,
    events: string[]
  ): Promise<WebhookSubscription> {
    try {
      const secret = this.generateSecret();

      const { data, error } = await supabase
        .from('webhook_subscriptions')
        .insert({
          user_id: userId,
          clinic_id: clinicId,
          name,
          url,
          events,
          secret,
          is_active: true,
          total_delivered: 0,
          total_failed: 0
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating webhook subscription:', error);
      throw new Error('Failed to create webhook subscription');
    }
  }

  /**
   * Get webhook subscriptions for clinic
   */
  async getWebhookSubscriptions(clinicId: string): Promise<WebhookSubscription[]> {
    try {
      const { data, error } = await supabase
        .from('webhook_subscriptions')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting webhook subscriptions:', error);
      return [];
    }
  }

  /**
   * Update webhook subscription
   */
  async updateWebhookSubscription(
    subscriptionId: string,
    updates: Partial<Pick<WebhookSubscription, 'name' | 'url' | 'events' | 'is_active'>>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('webhook_subscriptions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating webhook subscription:', error);
      throw new Error('Failed to update webhook subscription');
    }
  }

  /**
   * Delete webhook subscription
   */
  async deleteWebhookSubscription(subscriptionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('webhook_subscriptions')
        .delete()
        .eq('id', subscriptionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting webhook subscription:', error);
      throw new Error('Failed to delete webhook subscription');
    }
  }

  /**
   * Regenerate webhook secret
   */
  async regenerateWebhookSecret(subscriptionId: string): Promise<string> {
    try {
      const secret = this.generateSecret();

      const { error } = await supabase
        .from('webhook_subscriptions')
        .update({
          secret,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) throw error;
      return secret;
    } catch (error) {
      console.error('Error regenerating webhook secret:', error);
      throw new Error('Failed to regenerate webhook secret');
    }
  }

  // ============================================================================
  // API DOCUMENTATION
  // ============================================================================

  /**
   * Get API documentation
   */
  async getAPIDocumentation(category?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('api_documentation')
        .select('*')
        .eq('is_published', true)
        .order('order_index', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting API documentation:', error);
      return [];
    }
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Get rate limit based on tier
   */
  private getRateLimit(tier: string): number {
    switch (tier) {
      case 'free':
        return 30;
      case 'basic':
        return 60;
      case 'pro':
        return 300;
      case 'enterprise':
        return 1000;
      default:
        return 60;
    }
  }

  /**
   * Get daily rate limit based on tier
   */
  private getDailyRateLimit(tier: string): number {
    switch (tier) {
      case 'free':
        return 500;
      case 'basic':
        return 1000;
      case 'pro':
        return 10000;
      case 'enterprise':
        return 100000;
      default:
        return 1000;
    }
  }

  /**
   * Generate random secret
   */
  private generateSecret(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get current user ID
   */
  private async getCurrentUserId(): Promise<string> {
    const { data } = await supabase.auth.getUser();
    return data.user?.id || '';
  }

  /**
   * Get current clinic ID
   */
  private async getCurrentClinicId(): Promise<string> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return '';

      const { data } = await supabase
        .from('clinic_members')
        .select('clinic_id')
        .eq('user_id', userData.user.id)
        .eq('is_active', true)
        .single();

      return data?.clinic_id || '';
    } catch (error) {
      return '';
    }
  }
}

// Export singleton instance
export const apiPlatformService = new APIPlatformService();
