-- Phase 1: Enhanced Security & Compliance
-- This migration creates tables for audit logging, security events, and MFA

-- Audit Log Table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_type TEXT CHECK (user_type IN ('provider', 'admin', 'staff', 'patient', 'system')),
  
  -- Action Details
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  changes JSONB,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  
  -- Timing
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_audit_logs_clinic ON public.audit_logs(clinic_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies: Clinic admins can view audit logs
CREATE POLICY "Clinic admins can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM public.clinic_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policies: System can insert audit logs
CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Security Events Table
CREATE TABLE public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Event Details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'login_attempt', 'permission_denied', 'data_access', 
    'suspicious_activity', 'brute_force', 'data_breach_attempt',
    'unusual_location', 'privilege_escalation'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  details JSONB,
  
  -- Resolution
  resolved BOOLEAN DEFAULT false,
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timing
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_security_events_clinic ON public.security_events(clinic_id);
CREATE INDEX idx_security_events_user ON public.security_events(user_id);
CREATE INDEX idx_security_events_type ON public.security_events(event_type);
CREATE INDEX idx_security_events_severity ON public.security_events(severity);
CREATE INDEX idx_security_events_resolved ON public.security_events(resolved);
CREATE INDEX idx_security_events_created ON public.security_events(created_at DESC);

-- Row Level Security
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Policies: Clinic admins can view security events
CREATE POLICY "Clinic admins can view security events"
  ON public.security_events FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM public.clinic_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policies: Clinic admins can manage security events
CREATE POLICY "Clinic admins can manage security events"
  ON public.security_events FOR ALL
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM public.clinic_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM public.clinic_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policies: System can insert security events
CREATE POLICY "System can insert security events"
  ON public.security_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- MFA Settings Table
CREATE TABLE public.mfa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
  
  -- MFA Configuration
  enabled BOOLEAN DEFAULT false,
  method TEXT CHECK (method IN ('totp', 'sms', 'email', 'none')),
  secret TEXT, -- Encrypted TOTP secret
  phone_number TEXT, -- Encrypted for SMS
  email_address TEXT, -- Encrypted for email
  
  -- Backup Codes
  backup_codes JSONB, -- Encrypted array of backup codes
  
  -- Metadata
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX idx_mfa_settings_user ON public.mfa_settings(user_id);
CREATE INDEX idx_mfa_settings_clinic ON public.mfa_settings(clinic_id);

-- Row Level Security
ALTER TABLE public.mfa_settings ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view their own MFA settings
CREATE POLICY "Users can view own MFA settings"
  ON public.mfa_settings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policies: Users can update their own MFA settings
CREATE POLICY "Users can update own MFA settings"
  ON public.mfa_settings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policies: Clinic admins can view MFA settings
CREATE POLICY "Clinic admins can view MFA settings"
  ON public.mfa_settings FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM public.clinic_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_mfa_settings_updated_at
  BEFORE UPDATE ON public.mfa_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to log audit event
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_clinic_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_user_type TEXT DEFAULT NULL,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_changes JSONB DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    clinic_id,
    user_id,
    user_type,
    action,
    resource_type,
    resource_id,
    changes,
    ip_address,
    user_agent,
    success,
    error_message
  ) VALUES (
    p_clinic_id,
    p_user_id,
    p_user_type,
    p_action,
    p_resource_type,
    p_resource_id,
    p_changes,
    inet_client_addr(),
    current_setting('request.headers.user-agent', true),
    p_success,
    p_error_message
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_audit_event FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_audit_event TO authenticated, service_role;

-- Function to create security event
CREATE OR REPLACE FUNCTION public.create_security_event(
  p_clinic_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_event_type TEXT,
  p_severity TEXT,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.security_events (
    clinic_id,
    user_id,
    event_type,
    severity,
    details,
    ip_address,
    user_agent
  ) VALUES (
    p_clinic_id,
    p_user_id,
    p_event_type,
    p_severity,
    p_details,
    inet_client_addr(),
    current_setting('request.headers.user-agent', true)
  ) RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_security_event FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_security_event TO authenticated, service_role;

-- Function to enable MFA for user
CREATE OR REPLACE FUNCTION public.enable_mfa(
  p_user_id UUID,
  p_method TEXT,
  p_secret TEXT,
  p_backup_codes TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.mfa_settings (
    user_id,
    method,
    secret,
    backup_codes,
    enabled,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_method,
    p_secret,
    to_jsonb(p_backup_codes),
    true,
    now(),
    now()
  ) ON CONFLICT (user_id) DO UPDATE SET
    method = EXCLUDED.method,
    secret = EXCLUDED.secret,
    backup_codes = EXCLUDED.backup_codes,
    enabled = true,
    updated_at = now();
  
  -- Log audit event
  PERFORM public.log_audit_event(
    NULL, -- clinic_id
    p_user_id,
    'user',
    'mfa_enabled',
    'user',
    p_user_id,
    jsonb_build_object('method', p_method),
    true
  );
  
  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enable_mfa FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enable_mfa TO authenticated;

-- Function to disable MFA for user
CREATE OR REPLACE FUNCTION public.disable_mfa(
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.mfa_settings
  SET 
    enabled = false,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Log audit event
  PERFORM public.log_audit_event(
    NULL, -- clinic_id
    p_user_id,
    'user',
    'mfa_disabled',
    'user',
    p_user_id,
    NULL,
    true
  );
  
  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.disable_mfa FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.disable_mfa TO authenticated;

-- Function to get audit logs for clinic
CREATE OR REPLACE FUNCTION public.get_clinic_audit_logs(
  p_clinic_id UUID,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_type TEXT,
  action TEXT,
  resource_type TEXT,
  resource_id UUID,
  success BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    user_id,
    user_type,
    action,
    resource_type,
    resource_id,
    success,
    created_at
  FROM public.audit_logs
  WHERE clinic_id = p_clinic_id
  ORDER BY created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

REVOKE EXECUTE ON FUNCTION public.get_clinic_audit_logs FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_clinic_audit_logs TO authenticated;
