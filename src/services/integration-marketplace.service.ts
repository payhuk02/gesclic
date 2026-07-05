// Integration Marketplace Service
// Service layer for Integration Marketplace functionality

import { supabase } from '@/integrations/supabase/client';
import type { 
  IntegrationCatalog,
  IntegrationInstance,
  IntegrationReview,
  WebhookEvent,
  IntegrationFilters,
  PaginatedResponse
} from '@/types/phase2';

export class IntegrationMarketplaceService {
  /**
   * Get integrations from catalog with filters
   */
  async getIntegrations(
    filters: IntegrationFilters = {},
    page: number = 1,
    perPage: number = 20
  ): Promise<PaginatedResponse<IntegrationCatalog>> {
    try {
      let query = supabase
        .from('integration_catalog')
        .select('*', { count: 'exact' })
        .eq('status', 'approved');

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.pricing_model) {
        query = query.eq('pricing_model', filters.pricing_model);
      }

      if (filters.featured) {
        query = query.eq('featured', true);
      }

      if (filters.min_rating) {
        query = query.gte('average_rating', filters.min_rating);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Apply pagination
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      const { data, error, count } = await query
        .order('average_rating', { ascending: false, nullsWith: 0 })
        .order('total_installs', { ascending: false })
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
      console.error('Error getting integrations:', error);
      throw new Error('Failed to get integrations');
    }
  }

  /**
   * Get single integration by ID
   */
  async getIntegration(id: string): Promise<IntegrationCatalog | null> {
    try {
      const { data, error } = await supabase
        .from('integration_catalog')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting integration:', error);
      return null;
    }
  }

  /**
   * Search integrations by query
   */
  async searchIntegrations(query: string): Promise<IntegrationCatalog[]> {
    return this.getIntegrations({ search: query }, 1, 20).then(r => r.data);
  }

  /**
   * Get featured integrations
   */
  async getFeaturedIntegrations(): Promise<IntegrationCatalog[]> {
    try {
      const { data, error } = await supabase
        .from('integration_catalog')
        .select('*')
        .eq('status', 'approved')
        .eq('featured', true)
        .order('average_rating', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting featured integrations:', error);
      return [];
    }
  }

  /**
   * Get integrations by category
   */
  async getIntegrationsByCategory(category: string): Promise<IntegrationCatalog[]> {
    try {
      const { data, error } = await supabase
        .from('integration_catalog')
        .select('*')
        .eq('status', 'approved')
        .eq('category', category)
        .order('average_rating', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting integrations by category:', error);
      return [];
    }
  }

  /**
   * Install integration for clinic
   */
  async installIntegration(
    clinicId: string,
    integrationId: string,
    config: Record<string, any> = {}
  ): Promise<IntegrationInstance> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      // Check if already installed
      const { data: existing } = await supabase
        .from('integration_instances')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('integration_id', integrationId)
        .single();

      if (existing) {
        throw new Error('Integration already installed');
      }

      // Create integration instance
      const { data, error } = await supabase
        .from('integration_instances')
        .insert({
          clinic_id,
          integration_id,
          config,
          enabled: true,
          sync_frequency: 'realtime',
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      // Log installation event
      await this.logAuditEvent('integration_installed', 'integration_instance', data.id, {
        integration_id: integrationId,
        clinic_id
      });

      return data;
    } catch (error) {
      console.error('Error installing integration:', error);
      throw new Error('Failed to install integration');
    }
  }

  /**
   * Uninstall integration
   */
  async uninstallIntegration(instanceId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('integration_instances')
        .delete()
        .eq('id', instanceId);

      if (error) throw error;

      // Log uninstallation event
      await this.logAuditEvent('integration_uninstalled', 'integration_instance', instanceId);
    } catch (error) {
      console.error('Error uninstalling integration:', error);
      throw new Error('Failed to uninstall integration');
    }
  }

  /**
   * Update integration configuration
   */
  async updateIntegrationConfig(
    instanceId: string,
    config: Record<string, any>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('integration_instances')
        .update({
          config,
          updated_at: new Date().toISOString()
        })
        .eq('id', instanceId);

      if (error) throw error;

      // Log configuration update event
      await this.logAuditEvent('integration_config_updated', 'integration_instance', instanceId, { config });
    } catch (error) {
      console.error('Error updating integration config:', error);
      throw new Error('Failed to update integration configuration');
    }
  }

  /**
   * Enable/disable integration
   */
  async toggleIntegration(instanceId: string, enabled: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('integration_instances')
        .update({
          enabled,
          status: enabled ? 'active' : 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', instanceId);

      if (error) throw error;

      // Log toggle event
      await this.logAuditEvent(
        enabled ? 'integration_enabled' : 'integration_disabled',
        'integration_instance',
        instanceId
      );
    } catch (error) {
      console.error('Error toggling integration:', error);
      throw new Error('Failed to toggle integration');
    }
  }

  /**
   * Get clinic's installed integrations
   */
  async getInstalledIntegrations(clinicId: string): Promise<IntegrationInstance[]> {
    try {
      const { data, error } = await supabase
        .from('integration_instances')
        .select('*, integration_catalog(*)')
        .eq('clinic_id', clinicId)
        .order('installed_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting installed integrations:', error);
      return [];
    }
  }

  /**
   * Get integration instance by ID
   */
  async getInstance(instanceId: string): Promise<IntegrationInstance | null> {
    try {
      const { data, error } = await supabase
        .from('integration_instances')
        .select('*, integration_catalog(*)')
        .eq('id', instanceId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting instance:', error);
      return null;
    }
  }

  // ============================================================================
  // REVIEWS
  // ============================================================================

  /**
   * Get reviews for an integration
   */
  async getReviews(integrationId: string, page: number = 1, perPage: number = 10): Promise<PaginatedResponse<IntegrationReview>> {
    try {
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      const { data, error, count } = await supabase
        .from('integration_reviews')
        .select('*', { count: 'exact' })
        .eq('integration_id', integrationId)
        .eq('status', 'published')
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
      console.error('Error getting reviews:', error);
      throw new Error('Failed to get reviews');
    }
  }

  /**
   * Submit a review for an integration
   */
  async submitReview(review: Omit<IntegrationReview, 'id' | 'created_at' | 'updated_at' | 'helpful_count' | 'verified_purchase'>): Promise<IntegrationReview> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      // Check if user has installed this integration
      const { data: instance } = await supabase
        .from('integration_instances')
        .select('*')
        .eq('integration_id', review.integration_id)
        .eq('clinic_id', review.clinic_id)
        .single();

      const verifiedPurchase = !!instance;

      const { data, error } = await supabase
        .from('integration_reviews')
        .insert({
          ...review,
          user_id: userData.user.id,
          verified_purchase,
          helpful_count: 0,
          status: 'published'
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error submitting review:', error);
      throw new Error('Failed to submit review');
    }
  }

  /**
   * Mark review as helpful
   */
  async markReviewHelpful(reviewId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment', {
        table_name: 'integration_reviews',
        column_name: 'helpful_count',
        row_id: reviewId
      });

      if (error) {
        const { data: review } = await supabase
          .from('integration_reviews')
          .select('helpful_count')
          .eq('id', reviewId)
          .single();

        await supabase
          .from('integration_reviews')
          .update({ helpful_count: (review?.helpful_count ?? 0) + 1 })
          .eq('id', reviewId);
      }
    } catch (error) {
      console.error('Error marking review helpful:', error);
      throw new Error('Failed to mark review helpful');
    }
  }

  // ============================================================================
  // WEBHOOKS
  // ============================================================================

  /**
   * Handle incoming webhook event
   */
  async handleWebhook(event: Omit<WebhookEvent, 'id' | 'created_at' | 'delivered_at' | 'delivery_attempts' | 'last_delivery_attempt'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('webhook_events')
        .insert({
          ...event,
          delivery_status: 'pending',
          delivery_attempts: 0
        });

      if (error) throw error;

      // Trigger webhook delivery (in a real implementation, this would be a background job)
      await this.deliverWebhook(event.event_type, event.event_data, event.delivery_url);
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw new Error('Failed to handle webhook');
    }
  }

  /**
   * Deliver webhook to external URL
   */
  private async deliverWebhook(
    eventType: string,
    eventData: Record<string, any>,
    deliveryUrl: string
  ): Promise<void> {
    try {
      const signature = await this.generateSignature(eventData);
      
      const response = await fetch(deliveryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gesclic-Event': eventType,
          'X-Gesclic-Signature': signature
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        throw new Error(`Webhook delivery failed: ${response.status}`);
      }

      // In a real implementation, update the webhook event status to 'delivered'
    } catch (error) {
      console.error('Error delivering webhook:', error);
      // In a real implementation, update the webhook event status to 'failed'
    }
  }

  /**
   * Retry failed webhook
   */
  async retryWebhook(eventId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('retry_failed_webhook', {
        event_id: eventId
      });

      if (error) throw error;

      return data || false;
    } catch (error) {
      console.error('Error retrying webhook:', error);
      return false;
    }
  }

  /**
   * Get webhook events for an instance
   */
  async getWebhookEvents(instanceId: string, limit: number = 50): Promise<WebhookEvent[]> {
    try {
      const { data, error } = await supabase
        .from('webhook_events')
        .select('*')
        .eq('integration_instance_id', instanceId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting webhook events:', error);
      return [];
    }
  }

  /**
   * Generate HMAC-SHA256 webhook signature
   */
  private async generateSignature(data: Record<string, any>): Promise<string> {
    const secret = import.meta.env.VITE_WEBHOOK_SECRET || 'default-secret';
    const payload = JSON.stringify(data);
    
    try {
      // Import the secret key
      const keyData = new TextEncoder().encode(secret);
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      // Sign the payload
      const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        new TextEncoder().encode(payload)
      );
      
      // Convert to hex string
      const hashArray = Array.from(new Uint8Array(signature));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      return hashHex;
    } catch (error) {
      console.error('Error generating HMAC signature:', error);
      throw new Error('Failed to generate webhook signature');
    }
  }

  // ============================================================================
  // OAUTH
  // ============================================================================

  /**
   * Initiate OAuth flow
   */
  async initiateOAuth(integrationId: string): Promise<string> {
    try {
      const integration = await this.getIntegration(integrationId);
      if (!integration || integration.auth_type !== 'oauth2') {
        throw new Error('Invalid integration or auth type');
      }

      // Generate OAuth state for security
      const state = this.generateOAuthState();

      // In a real implementation, redirect to OAuth provider's authorization URL
      // with the state parameter
      const authUrl = `${integration.api_documentation_url}/authorize?state=${state}`;

      return authUrl;
    } catch (error) {
      console.error('Error initiating OAuth:', error);
      throw new Error('Failed to initiate OAuth flow');
    }
  }

  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(code: string, state: string): Promise<void> {
    try {
      // Validate state
      if (!this.validateOAuthState(state)) {
        throw new Error('Invalid OAuth state');
      }

      // Exchange code for access token
      // In a real implementation, call the OAuth provider's token endpoint
      const accessToken = await this.exchangeCodeForToken(code);

      // Store the token securely
      // In a real implementation, encrypt and store in oauth_tokens table
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      throw new Error('Failed to handle OAuth callback');
    }
  }

  /**
   * Refresh OAuth token
   */
  async refreshOAuthToken(instanceId: string): Promise<void> {
    try {
      // Get the refresh token from oauth_tokens table
      // Call the OAuth provider's refresh endpoint
      // Update the stored tokens
    } catch (error) {
      console.error('Error refreshing OAuth token:', error);
      throw new Error('Failed to refresh OAuth token');
    }
  }

  /**
   * Generate OAuth state
   */
  private generateOAuthState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Validate OAuth state
   */
  private validateOAuthState(state: string): boolean {
    // In a real implementation, validate against stored state
    return state.length === 28;
  }

  /**
   * Exchange authorization code for access token
   */
  private async exchangeCodeForToken(code: string): Promise<string> {
    // In a real implementation, call the OAuth provider's token endpoint
    return 'mock_access_token';
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Log audit event
   */
  private async logAuditEvent(
    action: string,
    resourceType: string,
    resourceId: string,
    changes?: Record<string, any>
  ): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const clinicId = await this.getCurrentClinicId();

      // This would call the security service's logAuditEvent method
      // For now, we'll just log to console
      console.log('Audit Event:', {
        clinic_id: clinicId,
        user_id: userData.user?.id,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        changes
      });
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
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
export const integrationMarketplaceService = new IntegrationMarketplaceService();
