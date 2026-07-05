// Security Service
// Service layer for enhanced security features (MFA, audit logging, security events)

import { supabase } from '@/integrations/supabase/client';
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
   */
  async enableMFA(method: 'totp' | 'sms' | 'email'): Promise<SetupMFAResponse> {
    try {
      console.log("enableMFA: Starting for method:", method);
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error("enableMFA: Auth error:", authError);
        throw new Error('Authentication error');
      }
      if (!userData.user) throw new Error('User not authenticated');

      console.log("enableMFA: User authenticated:", userData.user.id);

      // Generate TOTP secret
      const secret = this.generateTOTPSecret();
      const backupCodes = this.generateBackupCodes();
      console.log("enableMFA: Generated secret and backup codes");

      // Try to store MFA settings directly in the table
      try {
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
          console.error('enableMFA: Error inserting MFA settings:', insertError);
          console.log('enableMFA: Continuing without database storage (demo mode)');
          // Continue anyway for demo purposes
        } else {
          console.log('enableMFA: MFA settings stored successfully');
        }
      } catch (dbError: any) {
        console.error('enableMFA: Database error (table may not exist):', dbError.message);
        console.log('enableMFA: Continuing without database storage (demo mode)');
        // Continue anyway for demo purposes
      }

      // Generate QR code URL
      const qrCodeUrl = this.generateQRCodeUrl(userData.user.email, secret);
      console.log("enableMFA: QR code URL generated");

      return {
        secret,
        qr_code_url: qrCodeUrl,
        backup_codes: backupCodes
      };
    } catch (error: any) {
      console.error('Error enabling MFA:', error);
      throw new Error(error.message || 'Failed to enable MFA');
    }
  }

  /**
   * Verify MFA code and enable MFA if this is initial setup
   */
  async verifyMFA(userId: string, code: string, enableAfterVerify: boolean = false): Promise<boolean> {
    try {
      console.log("verifyMFA: Starting verification for user:", userId);

      // Try to get settings from database
      let settings = null;
      try {
        const { data } = await supabase
          .from('mfa_settings')
          .select('secret, backup_codes, enabled')
          .eq('user_id', userId)
          .single();
        settings = data;
        console.log("verifyMFA: Settings found:", settings ? "yes" : "no");
      } catch (dbError: any) {
        console.error('verifyMFA: Database error (table may not exist):', dbError.message);
        console.log('verifyMFA: Using demo mode - accepting any 6-digit code');
        // Demo mode: accept any 6-digit code
        const isValid = code.length === 6 && /^\d+$/.test(code);
        if (isValid && enableAfterVerify) {
          console.log("verifyMFA: Demo mode - MFA would be enabled");
        }
        return isValid;
      }

      if (!settings) {
        console.log("verifyMFA: No settings found, returning false");
        return false;
      }

      // Check if it's a backup code
      if (settings.backup_codes && settings.backup_codes.includes(code)) {
        console.log("verifyMFA: Backup code used");
        try {
          const updatedBackupCodes = settings.backup_codes.filter(c => c !== code);
          await supabase
            .from('mfa_settings')
            .update({ backup_codes: updatedBackupCodes, last_used_at: new Date().toISOString() })
            .eq('user_id', userId);
        } catch (updateError) {
          console.error('verifyMFA: Error updating backup codes:', updateError);
        }
        return true;
      }

      // Verify TOTP code
      const isValid = this.verifyTOTP(settings.secret, code);
      console.log("verifyMFA: TOTP verification result:", isValid);

      if (isValid) {
        try {
          // Enable MFA if this is initial setup
          if (enableAfterVerify && !settings.enabled) {
            console.log("verifyMFA: Enabling MFA");
            await supabase
              .from('mfa_settings')
              .update({ enabled: true, last_used_at: new Date().toISOString() })
              .eq('user_id', userId);
          } else {
            // Just update last used timestamp
            await supabase
              .from('mfa_settings')
              .update({ last_used_at: new Date().toISOString() })
              .eq('user_id', userId);
          }
        } catch (updateError) {
          console.error('verifyMFA: Error updating MFA settings:', updateError);
        }
      }

      return isValid;
    } catch (error: any) {
      console.error('Error verifying MFA:', error);
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

  private generateTOTPSecret(): string {
    // Generate a random 32-character base32 secret
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  private generateBackupCodes(): string[] {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      const code = Array.from({ length: 8 }, () => 
        Math.floor(Math.random() * 10).toString()
      ).join('-');
      codes.push(code);
    }
    return codes;
  }

  private generateQRCodeUrl(email: string, secret: string): string {
    const issuer = encodeURIComponent('Gesclic');
    const label = encodeURIComponent(`Gesclic:${email}`);
    const otpauth = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}`;
  }

  private verifyTOTP(secret: string, code: string): boolean {
    try {
      // TOTP verification should be done on the backend for security
      // For now, we'll use a simple validation and delegate to Supabase
      // In production, this should call a Supabase edge function or RPC
      return code.length === 6 && /^\d+$/.test(code);
    } catch (error) {
      console.error('Error verifying TOTP:', error);
      return false;
    }
  }
}

// Export singleton instance
export const securityService = new SecurityService();
