// Security Service
// Enterprise-grade security service for MFA, audit logging, and security events
// Implements security best practices from Stripe, Vercel, and HubSpot

import { supabase } from '@/integrations/supabase/client';
import { TOTP } from 'otpauth';
import type {
  AuditLog,
  SecurityEvent,
  MFASettings,
  SetupMFAResponse
} from '@/types/phase1';

export class SecurityService {
  /**
   * Log audit event
   */
  async logAuditEvent(
    action: string,
    resourceType: string,
    resourceId?: string,
    changes?: Record<string, any>,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const clinicId = await this.getCurrentClinicId();

      await supabase.rpc('log_audit_event', {
        p_clinic_id: clinicId,
        p_user_id: userData.user?.id,
        p_user_type: await this.getUserType(),
        p_action: action,
        p_resource_type: resourceType,
        p_resource_id: resourceId,
        p_changes: changes,
        p_success: success,
        p_error_message: errorMessage
      });
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  }

  /**
   * Create security event
   */
  async createSecurityEvent(
    eventType: 'login_attempt' | 'permission_denied' | 'data_access' | 'suspicious_activity' | 'brute_force' | 'data_breach_attempt' | 'unusual_location' | 'privilege_escalation',
    severity: 'low' | 'medium' | 'high' | 'critical',
    details?: Record<string, any>
  ): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const clinicId = await this.getCurrentClinicId();

      await supabase.rpc('create_security_event', {
        p_clinic_id: clinicId,
        p_user_id: userData.user?.id,
        p_event_type: eventType,
        p_severity: severity,
        p_details: details
      });
    } catch (error) {
      console.error('Error creating security event:', error);
    }
  }

  /**
   * Get audit logs for clinic
   */
  async getAuditLogs(
    clinicId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase.rpc('get_clinic_audit_logs', {
        p_clinic_id: clinicId,
        p_limit: limit,
        p_offset: offset
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting audit logs:', error);
      return [];
    }
  }

  /**
   * Get security events for clinic
   */
  async getSecurityEvents(
    clinicId: string,
    resolved?: boolean
  ): Promise<SecurityEvent[]> {
    try {
      let query = supabase
        .from('security_events')
        .select('*')
        .eq('clinic_id', clinicId);

      if (resolved !== undefined) {
        query = query.eq('resolved', resolved);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting security events:', error);
      return [];
    }
  }

  /**
   * Resolve security event
   */
  async resolveSecurityEvent(
    eventId: string,
    resolutionNotes: string
  ): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('security_events')
        .update({
          resolved: true,
          resolution_notes: resolutionNotes,
          resolved_at: new Date().toISOString(),
          resolved_by: userData.user?.id
        })
        .eq('id', eventId);

      if (error) throw error;
    } catch (error) {
      console.error('Error resolving security event:', error);
      throw new Error('Failed to resolve security event');
    }
  }

  /**
   * Get MFA settings for user
   */
  async getMFASettings(userId: string): Promise<MFASettings | null> {
    try {
      const { data, error } = await supabase
        .from('mfa_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) return null;
      return data;
    } catch (error) {
      console.error('Error getting MFA settings:', error);
      return null;
    }
  }

  /**
   * Enable MFA for user
   * Enterprise-grade MFA setup with proper error handling and security
   */
  async enableMFA(method: 'totp' | 'sms' | 'email'): Promise<SetupMFAResponse> {
    try {
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        throw new Error('Authentication error');
      }
      if (!userData.user) throw new Error('User not authenticated');

      // Generate cryptographically secure TOTP secret
      const secret = this.generateSecureTOTPSecret();
      const backupCodes = this.generateSecureBackupCodes();

      // Store MFA settings in database - MUST succeed for security
      const { error: insertError } = await supabase
        .from('mfa_settings')
        .upsert({
          user_id: userData.user.id,
          enabled: false, // Will be enabled after verification
          method: method,
          secret: secret,
          backup_codes: backupCodes,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (insertError) {
        // Log security event for failed MFA setup
        await this.createSecurityEvent('suspicious_activity', 'high', {
          action: 'mfa_setup_failed',
          error: insertError.message,
          user_id: userData.user.id
        });
        throw new Error('Failed to store MFA settings. Please contact support.');
      }

      // Generate QR code URL
      const qrCodeUrl = this.generateQRCodeUrl(userData.user.email ?? '', secret);

      // Log successful MFA setup initiation
      await this.logAuditEvent('mfa_setup_initiated', 'mfa_settings', userData.user.id, {
        method
      }, true);

      return {
        secret,
        qr_code_url: qrCodeUrl,
        backup_codes: backupCodes
      };
    } catch (error: any) {
      await this.createSecurityEvent('suspicious_activity', 'medium', {
        action: 'mfa_setup_error',
        error: error.message
      });
      throw new Error(error.message || 'Failed to enable MFA');
    }
  }

  /**
   * Verify MFA code and enable MFA if this is initial setup
   * Enterprise-grade verification with proper TOTP validation
   */
  async verifyMFA(userId: string, code: string, enableAfterVerify: boolean = false): Promise<boolean> {
    try {
      // Get settings from database - MUST exist for security
      const { data: settings, error: fetchError } = await supabase
        .from('mfa_settings')
        .select('secret, backup_codes, enabled, method')
        .eq('user_id', userId)
        .single();

      if (fetchError || !settings) {
        await this.createSecurityEvent('suspicious_activity', 'high', {
          action: 'mfa_verification_failed',
          reason: 'settings_not_found',
          user_id: userId
        });
        return false;
      }

      // Check if it's a backup code first
      if (settings.backup_codes && settings.backup_codes.includes(code)) {
        try {
          const updatedBackupCodes = settings.backup_codes.filter(c => c !== code);
          await supabase
            .from('mfa_settings')
            .update({ 
              backup_codes: updatedBackupCodes, 
              last_used_at: new Date().toISOString() 
            })
            .eq('user_id', userId);

          await this.logAuditEvent('mfa_backup_code_used', 'mfa_settings', userId, {
            backup_code_used: true
          }, true);

          return true;
        } catch (updateError) {
          await this.createSecurityEvent('suspicious_activity', 'high', {
            action: 'mfa_backup_code_update_failed',
            error: updateError
          });
          return false;
        }
      }

      // Verify TOTP code using proper algorithm
      const isValid = this.verifyTOTP(settings.secret, code);

      if (isValid) {
        try {
          // Enable MFA if this is initial setup
          if (enableAfterVerify && !settings.enabled) {
            await supabase
              .from('mfa_settings')
              .update({ 
                enabled: true, 
                last_used_at: new Date().toISOString() 
              })
              .eq('user_id', userId);

            await this.logAuditEvent('mfa_enabled', 'mfa_settings', userId, {
              method: settings.method
            }, true);
          } else {
            // Just update last used timestamp
            await supabase
              .from('mfa_settings')
              .update({ last_used_at: new Date().toISOString() })
              .eq('user_id', userId);
          }
        } catch (updateError) {
          await this.createSecurityEvent('suspicious_activity', 'medium', {
            action: 'mfa_verification_update_failed',
            error: updateError
          });
          return false;
        }
      } else {
        // Log failed verification attempt
        await this.createSecurityEvent('suspicious_activity', 'medium', {
          action: 'mfa_verification_failed',
          user_id: userId,
          method: settings.method
        });
      }

      return isValid;
    } catch (error: any) {
      await this.createSecurityEvent('suspicious_activity', 'high', {
        action: 'mfa_verification_error',
        error: error.message
      });
      return false;
    }
  }

  /**
   * Disable MFA for user
   */
  async disableMFA(userId: string, currentCode: string): Promise<void> {
    try {
      // Verify current code before disabling
      const isValid = await this.verifyMFA(userId, currentCode);
      if (!isValid) {
        throw new Error('Invalid MFA code');
      }

      await supabase
        .from('mfa_settings')
        .update({ enabled: false, secret: null, backup_codes: [] })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error disabling MFA:', error);
      throw new Error('Failed to disable MFA');
    }
  }

  /**
   * Check if user has MFA enabled
   */
  async isMFAEnabled(userId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('mfa_settings')
        .select('enabled')
        .eq('user_id', userId)
        .single();

      return data?.enabled || false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get security summary for clinic
   */
  async getSecuritySummary(clinicId: string): Promise<{
    totalEvents: number;
    criticalEvents: number;
    unresolvedEvents: number;
    recentActivity: AuditLog[];
  }> {
    try {
      const { count: totalEvents } = await supabase
        .from('security_events')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', clinicId);

      const { count: criticalEvents } = await supabase
        .from('security_events')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', clinicId)
        .eq('severity', 'critical');

      const { count: unresolvedEvents } = await supabase
        .from('security_events')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', clinicId)
        .eq('resolved', false);

      const recentActivity = await this.getAuditLogs(clinicId, 10, 0);

      return {
        totalEvents: totalEvents || 0,
        criticalEvents: criticalEvents || 0,
        unresolvedEvents: unresolvedEvents || 0,
        recentActivity
      };
    } catch (error) {
      console.error('Error getting security summary:', error);
      return {
        totalEvents: 0,
        criticalEvents: 0,
        unresolvedEvents: 0,
        recentActivity: []
      };
    }
  }

  // Helper methods

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

  private async getUserType(): Promise<string> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return 'patient';

      const { data } = await supabase
        .from('clinic_members')
        .select('role')
        .eq('user_id', userData.user.id)
        .eq('is_active', true)
        .single();

      return data?.role || 'patient';
    } catch (error) {
      return 'patient';
    }
  }

  /**
   * Generate cryptographically secure TOTP secret
   * Using crypto API for enterprise-grade security
   */
  private generateSecureTOTPSecret(): string {
    // Use crypto API for secure random generation
    const array = new Uint8Array(20);
    crypto.getRandomValues(array);
    
    // Convert to base32
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < array.length; i += 5) {
      const chunk = array.slice(i, i + 5);
      for (let j = 0; j < 8; j++) {
        if (j < chunk.length) {
          const byte = chunk[j];
          const index = (byte >> (5 * (j % 5))) & 31;
          secret += base32Chars[index];
        }
      }
    }
    return secret.substring(0, 32);
  }

  /**
   * Generate cryptographically secure backup codes
   * Following NIST SP 800-63B guidelines
   */
  private generateSecureBackupCodes(): string[] {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      // Generate 8 random bytes for each code
      const array = new Uint8Array(8);
      crypto.getRandomValues(array);
      
      // Convert to readable format (4 groups of 4 characters)
      const code = Array.from(array, byte => 
        byte.toString(16).padStart(2, '0').toUpperCase()
      ).join('').match(/.{1,4}/g)?.join('-') || '';
      
      codes.push(code);
    }
    return codes;
  }

  /**
   * Generate QR code URL for TOTP setup
   * Using Google Authenticator format
   */
  private generateQRCodeUrl(email: string, secret: string): string {
    const issuer = encodeURIComponent('Gesclic Medical');
    const label = encodeURIComponent(`Gesclic:${email}`);
    const otpauth = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}`;
  }

  /**
   * Verify TOTP code using proper algorithm
   * Implements RFC 6238 TOTP specification
   */
  private verifyTOTP(secret: string, code: string): boolean {
    try {
      // Create TOTP instance with proper parameters
      const totp = new TOTP({
        issuer: 'Gesclic Medical',
        label: 'Gesclic',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: secret
      });

      // Verify code with window of 1 period (30 seconds) to account for clock drift
      const delta = totp.validate({ token: code, window: 1 });
      
      // delta will be 0 if valid, null if invalid
      return delta !== null;
    } catch (error) {
      // Log security event for verification errors
      this.createSecurityEvent('suspicious_activity', 'medium', {
        action: 'totp_verification_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }
}

// Export singleton instance
export const securityService = new SecurityService();
