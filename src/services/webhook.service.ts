// Webhook Service
// Service layer for webhook delivery and management

import { supabase } from '@/integrations/supabase/client';
import type { WebhookEvent, WebhookSubscription } from '@/types/phase2';

export interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  response?: string;
  error?: string;
}

export class WebhookService {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [1000, 5000, 15000]; // 1s, 5s, 15s
  private readonly WEBHOOK_SECRET = import.meta.env.VITE_WEBHOOK_SECRET || 'default-secret';

  /**
   * Deliver webhook to external URL
   */
  async deliverWebhook(
    eventId: string,
    eventType: string,
    eventData: Record<string, any>,
    deliveryUrl: string
  ): Promise<WebhookDeliveryResult> {
    try {
      const signature = await this.generateSignature(eventData);
      
      const response = await fetch(deliveryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Gesclic-Webhook/1.0',
          'X-Gesclic-Event': eventType,
          'X-Gesclic-Signature': signature,
          'X-Gesclic-Delivery-ID': eventId,
          'X-Gesclic-Timestamp': Date.now().toString()
        },
        body: JSON.stringify(eventData),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      const responseText = await response.text();
      const success = response.ok;

      // Update webhook event status
      const { data: existing } = await supabase
        .from('webhook_events')
        .select('delivery_attempts')
        .eq('id', eventId)
        .single();

      await this.updateWebhookEvent(eventId, {
        delivery_status: success ? 'delivered' : 'failed',
        delivery_attempts: (existing?.delivery_attempts ?? 0) + 1,
        last_delivery_attempt: new Date().toISOString(),
        delivery_response: responseText,
        delivered_at: success ? new Date().toISOString() : null
      });

      return {
        success,
        statusCode: response.status,
        response: responseText,
        error: success ? undefined : `HTTP ${response.status}: ${responseText}`
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      const { data: existing } = await supabase
        .from('webhook_events')
        .select('delivery_attempts')
        .eq('id', eventId)
        .single();

      await this.updateWebhookEvent(eventId, {
        delivery_status: 'failed',
        delivery_attempts: (existing?.delivery_attempts ?? 0) + 1,
        last_delivery_attempt: new Date().toISOString(),
        delivery_response: errorMessage
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Deliver webhook with retry logic
   */
  async deliverWithRetry(
    eventId: string,
    eventType: string,
    eventData: Record<string, any>,
    deliveryUrl: string
  ): Promise<WebhookDeliveryResult> {
    let lastError: string | undefined;
    
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      const result = await this.deliverWebhook(eventId, eventType, eventData, deliveryUrl);
      
      if (result.success) {
        return result;
      }
      
      lastError = result.error;
      
      // Don't wait after the last attempt
      if (attempt < this.MAX_RETRIES - 1) {
        const delay = this.RETRY_DELAYS[attempt];
        await this.sleep(delay);
      }
    }
    
    // All retries failed
    await this.updateWebhookEvent(eventId, {
      delivery_status: 'failed'
    });
    
    return {
      success: false,
      error: lastError || 'Max retries exceeded'
    };
  }

  /**
   * Queue webhook for background delivery
   */
  async queueWebhook(
    instanceId: string,
    eventType: string,
    eventData: Record<string, any>,
    deliveryUrl: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('webhook_events')
        .insert({
          integration_instance_id: instanceId,
          event_type: eventType,
          event_data: eventData,
          delivery_url,
          delivery_status: 'pending',
          delivery_attempts: 0
        })
        .select('id')
        .single();

      if (error) throw error;

      // In a real implementation, this would add to a message queue
      // For now, deliver immediately
      this.deliverWithRetry(data.id, eventType, eventData, deliveryUrl).catch(console.error);

      return data.id;
    } catch (error) {
      console.error('Error queueing webhook:', error);
      throw new Error('Failed to queue webhook');
    }
  }

  /**
   * Retry failed webhook
   */
  async retryWebhook(eventId: string): Promise<WebhookDeliveryResult> {
    try {
      const { data: event, error } = await supabase
        .from('webhook_events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error || !event) {
        throw new Error('Webhook event not found');
      }

      if (event.delivery_status !== 'failed') {
        throw new Error('Webhook is not in failed state');
      }

      // Update status to retrying
      await this.updateWebhookEvent(eventId, {
        delivery_status: 'retrying'
      });

      // Attempt delivery
      return await this.deliverWithRetry(
        eventId,
        event.event_type,
        event.event_data,
        event.delivery_url
      );
    } catch (error) {
      console.error('Error retrying webhook:', error);
      throw new Error('Failed to retry webhook');
    }
  }

  /**
   * Get webhook delivery statistics
   */
  async getDeliveryStats(instanceId: string, days: number = 30): Promise<{
    total: number;
    delivered: number;
    failed: number;
    pending: number;
    successRate: number;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('webhook_events')
        .select('delivery_status')
        .eq('integration_instance_id', instanceId)
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        delivered: data?.filter(e => e.delivery_status === 'delivered').length || 0,
        failed: data?.filter(e => e.delivery_status === 'failed').length || 0,
        pending: data?.filter(e => e.delivery_status === 'pending').length || 0,
        successRate: 0
      };

      stats.successRate = stats.total > 0 
        ? (stats.delivered / stats.total) * 100 
        : 0;

      return stats;
    } catch (error) {
      console.error('Error getting delivery stats:', error);
      return {
        total: 0,
        delivered: 0,
        failed: 0,
        pending: 0,
        successRate: 0
      };
    }
  }

  /**
   * Create webhook subscription
   */
  async createSubscription(
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
          clinic_id,
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
   * Update webhook subscription
   */
  async updateSubscription(
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
  async deleteSubscription(subscriptionId: string): Promise<void> {
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
   * Get webhook subscriptions for clinic
   */
  async getSubscriptions(clinicId: string): Promise<WebhookSubscription[]> {
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
   * Trigger webhook for event type
   */
  async triggerEvent(eventType: string, eventData: Record<string, any>): Promise<void> {
    try {
      // Get all active subscriptions that listen to this event
      const clinicId = await this.getCurrentClinicId();
      
      const { data: subscriptions } = await supabase
        .from('webhook_subscriptions')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .contains('events', [eventType]);

      if (!subscriptions || subscriptions.length === 0) {
        return;
      }

      // Queue webhook for each subscription
      for (const subscription of subscriptions) {
        await this.queueWebhook(
          subscription.id,
          eventType,
          eventData,
          subscription.url
        );
      }
    } catch (error) {
      console.error('Error triggering webhook event:', error);
    }
  }

  /**
   * Verify webhook signature
   */
  async verifySignature(payload: string, signature: string, secret?: string): Promise<boolean> {
    const expectedSignature = await this.generateSignature(
      JSON.parse(payload),
      secret || this.WEBHOOK_SECRET
    );
    
    return signature === expectedSignature;
  }

  /**
   * Generate HMAC-SHA256 signature for webhook
   */
  private async generateSignature(data: Record<string, any>, secret?: string): Promise<string> {
    const secretKey = secret || this.WEBHOOK_SECRET;
    const payload = JSON.stringify(data);
    
    try {
      // Import the secret key
      const keyData = new TextEncoder().encode(secretKey);
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
      
      return `sha256=${hashHex}`;
    } catch (error) {
      console.error('Error generating HMAC signature:', error);
      throw new Error('Failed to generate webhook signature');
    }
  }

  /**
   * Generate random secret for webhook subscription
   */
  private generateSecret(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Update webhook event in database
   */
  private async updateWebhookEvent(
    eventId: string,
    updates: Record<string, any>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('webhook_events')
        .update(updates)
        .eq('id', eventId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating webhook event:', error);
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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

  /**
   * Process pending webhooks (for background job)
   */
  async processPendingWebhooks(): Promise<number> {
    try {
      const { data: pendingEvents, error } = await supabase
        .from('webhook_events')
        .select('*')
        .eq('delivery_status', 'pending')
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      let processed = 0;
      
      for (const event of pendingEvents || []) {
        try {
          await this.deliverWithRetry(
            event.id,
            event.event_type,
            event.event_data,
            event.delivery_url
          );
          processed++;
        } catch (error) {
          console.error(`Error processing webhook ${event.id}:`, error);
        }
      }

      return processed;
    } catch (error) {
      console.error('Error processing pending webhooks:', error);
      return 0;
    }
  }

  /**
   * Clean up old webhook events
   */
  async cleanupOldEvents(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { count, error } = await supabase
        .from('webhook_events')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .not('delivery_status', 'eq', 'pending');

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('Error cleaning up old webhook events:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const webhookService = new WebhookService();
