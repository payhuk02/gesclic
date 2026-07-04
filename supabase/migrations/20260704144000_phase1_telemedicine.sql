-- Phase 1: Telemedicine Integration
-- This migration creates tables for video consultation management

-- Telemedicine Sessions Table
CREATE TABLE public.telemedicine_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  
  -- Session Details
  daily_room_name TEXT UNIQUE NOT NULL,
  daily_room_url TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'waiting', 'in_progress', 'completed', 'cancelled', 'no_show')),
  
  -- Session Timing
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Recording
  recording_url TEXT,
  recording_status TEXT CHECK (recording_status IN ('none', 'recording', 'processed', 'available')),
  consent_recording BOOLEAN DEFAULT false,
  
  -- Technical Details
  connection_quality TEXT CHECK (connection_quality IN ('excellent', 'good', 'fair', 'poor')),
  technical_issues JSONB,
  
  -- Clinical Notes
  clinical_notes TEXT,
  diagnosis TEXT,
  treatment_plan TEXT,
  follow_up_actions JSONB,
  
  -- Patient Feedback
  patient_rating INTEGER CHECK (patient_rating >= 1 AND patient_rating <= 5),
  patient_feedback TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_telemedicine_sessions_appointment ON public.telemedicine_sessions(appointment_id);
CREATE INDEX idx_telemedicine_sessions_patient ON public.telemedicine_sessions(patient_id);
CREATE INDEX idx_telemedicine_sessions_provider ON public.telemedicine_sessions(provider_id);
CREATE INDEX idx_telemedicine_sessions_clinic ON public.telemedicine_sessions(clinic_id);
CREATE INDEX idx_telemedicine_sessions_status ON public.telemedicine_sessions(status);
CREATE INDEX idx_telemedicine_sessions_scheduled ON public.telemedicine_sessions(scheduled_start);

-- Row Level Security
ALTER TABLE public.telemedicine_sessions ENABLE ROW LEVEL SECURITY;

-- Policies: Clinic members can view telemedicine sessions
CREATE POLICY "Clinic members can view telemedicine sessions"
  ON public.telemedicine_sessions FOR SELECT
  TO authenticated
  USING (public.is_clinic_member(clinic_id, auth.uid()));

-- Policies: Clinic providers can insert telemedicine sessions
CREATE POLICY "Clinic providers can insert telemedicine sessions"
  ON public.telemedicine_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_clinic_member(clinic_id, auth.uid())
    AND auth.uid() = provider_id
  );

-- Policies: Clinic providers can update telemedicine sessions
CREATE POLICY "Clinic providers can update telemedicine sessions"
  ON public.telemedicine_sessions FOR UPDATE
  TO authenticated
  USING (
    public.is_clinic_member(clinic_id, auth.uid())
    AND auth.uid() = provider_id
  )
  WITH CHECK (
    public.is_clinic_member(clinic_id, auth.uid())
    AND auth.uid() = provider_id
  );

-- Trigger for updated_at
CREATE TRIGGER update_telemedicine_sessions_updated_at
  BEFORE UPDATE ON public.telemedicine_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Telemedicine Settings Table (per clinic)
CREATE TABLE public.telemedicine_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  
  -- Configuration
  enable_video BOOLEAN DEFAULT true,
  enable_recording BOOLEAN DEFAULT false,
  require_consent_for_recording BOOLEAN DEFAULT true,
  max_session_duration_minutes INTEGER DEFAULT 30,
  buffer_time_minutes INTEGER DEFAULT 5,
  
  -- Quality Settings
  preferred_video_quality TEXT DEFAULT 'hd' CHECK (preferred_video_quality IN ('sd', 'hd', 'fhd')),
  enable_screen_sharing BOOLEAN DEFAULT true,
  enable_chat BOOLEAN DEFAULT true,
  
  -- Waiting Room
  enable_waiting_room BOOLEAN DEFAULT true,
  waiting_room_message TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(clinic_id)
);

-- Row Level Security
ALTER TABLE public.telemedicine_settings ENABLE ROW LEVEL SECURITY;

-- Policies: Clinic members can view telemedicine settings
CREATE POLICY "Clinic members can view telemedicine settings"
  ON public.telemedicine_settings FOR SELECT
  TO authenticated
  USING (public.is_clinic_member(clinic_id, auth.uid()));

-- Policies: Clinic admins can manage telemedicine settings
CREATE POLICY "Clinic admins can manage telemedicine settings"
  ON public.telemedicine_settings FOR ALL
  TO authenticated
  USING (
    public.has_clinic_role(clinic_id, auth.uid(), 'admin'::public.app_role)
  )
  WITH CHECK (
    public.has_clinic_role(clinic_id, auth.uid(), 'admin'::public.app_role)
  );

-- Trigger for updated_at
CREATE TRIGGER update_telemedicine_settings_updated_at
  BEFORE UPDATE ON public.telemedicine_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create telemedicine session
CREATE OR REPLACE FUNCTION public.create_telemedicine_session(
  p_appointment_id UUID,
  p_patient_id UUID,
  p_provider_id UUID,
  p_clinic_id UUID,
  p_scheduled_start TIMESTAMPTZ,
  p_scheduled_end TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_name TEXT;
  v_session_id UUID;
  v_settings RECORD;
BEGIN
  -- Get clinic settings
  SELECT * INTO v_settings
  FROM public.telemedicine_settings
  WHERE clinic_id = p_clinic_id;
  
  -- If no settings, use defaults
  IF NOT FOUND THEN
    v_settings.enable_video := true;
    v_settings.enable_recording := false;
  END IF;
  
  -- Generate unique room name
  v_room_name := 'gesclic-' || encode(gen_random_bytes(16), 'hex');
  
  -- Create session
  INSERT INTO public.telemedicine_sessions (
    appointment_id,
    patient_id,
    provider_id,
    clinic_id,
    daily_room_name,
    scheduled_start,
    scheduled_end,
    status
  ) VALUES (
    p_appointment_id,
    p_patient_id,
    p_provider_id,
    p_clinic_id,
    v_room_name,
    p_scheduled_start,
    p_scheduled_end,
    'scheduled'
  ) RETURNING id INTO v_session_id;
  
  RETURN v_session_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_telemedicine_session FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_telemedicine_session TO authenticated;

-- Function to update session status
CREATE OR REPLACE FUNCTION public.update_telemedicine_session_status(
  p_session_id UUID,
  p_status TEXT,
  p_actual_start TIMESTAMPTZ DEFAULT NULL,
  p_actual_end TIMESTAMPTZ DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.telemedicine_sessions
  SET 
    status = p_status,
    actual_start = COALESCE(p_actual_start, actual_start),
    actual_end = COALESCE(p_actual_end, actual_end),
    duration_seconds = CASE 
      WHEN p_actual_end IS NOT NULL AND actual_start IS NOT NULL THEN
        EXTRACT(EPOCH FROM (p_actual_end - actual_start))::INTEGER
      ELSE duration_seconds
    END,
    updated_at = now()
  WHERE id = p_session_id
    AND clinic_id IN (SELECT clinic_id FROM public.clinic_members WHERE user_id = auth.uid() AND is_active);
  
  RETURN FOUND;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_telemedicine_session_status FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_telemedicine_session_status TO authenticated;
