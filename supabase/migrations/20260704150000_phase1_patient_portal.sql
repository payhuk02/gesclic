-- Phase 1: Patient Portal
-- This migration creates tables for patient portal functionality

-- Patient Portal Settings Table
CREATE TABLE public.patient_portal_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  
  -- Preferences
  enable_appointments BOOLEAN DEFAULT true,
  enable_messaging BOOLEAN DEFAULT true,
  enable_records_access BOOLEAN DEFAULT true,
  enable_payments BOOLEAN DEFAULT true,
  
  -- Notifications
  email_appointment_reminders BOOLEAN DEFAULT true,
  sms_appointment_reminders BOOLEAN DEFAULT false,
  email_test_results BOOLEAN DEFAULT true,
  sms_test_results BOOLEAN DEFAULT false,
  
  -- Security
  require_2fa BOOLEAN DEFAULT false,
  session_timeout_minutes INTEGER DEFAULT 30,
  
  -- Language
  preferred_language TEXT DEFAULT 'fr',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(patient_id, clinic_id)
);

-- Indexes
CREATE INDEX idx_patient_portal_settings_patient ON public.patient_portal_settings(patient_id);
CREATE INDEX idx_patient_portal_settings_clinic ON public.patient_portal_settings(clinic_id);

-- Row Level Security
ALTER TABLE public.patient_portal_settings ENABLE ROW LEVEL SECURITY;

-- Policies: Patients can view their own portal settings
CREATE POLICY "Patients can view own portal settings"
  ON public.patient_portal_settings FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM public.patients WHERE user_id = auth.uid()
    )
  );

-- Policies: Patients can update their own portal settings
CREATE POLICY "Patients can update own portal settings"
  ON public.patient_portal_settings FOR UPDATE
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM public.patients WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    patient_id IN (
      SELECT id FROM public.patients WHERE user_id = auth.uid()
    )
  );

-- Policies: Clinic members can view patient portal settings
CREATE POLICY "Clinic members can view patient portal settings"
  ON public.patient_portal_settings FOR SELECT
  TO authenticated
  USING (public.is_clinic_member(clinic_id, auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_patient_portal_settings_updated_at
  BEFORE UPDATE ON public.patient_portal_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Patient Messages Table
CREATE TABLE public.patient_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  
  -- Message Content
  subject TEXT,
  body TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('inquiry', 'appointment_request', 'prescription_refill', 'test_result', 'general')),
  
  -- Attachments
  attachments JSONB, -- [{url, name, type, size}]
  
  -- Status
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'archived')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Thread
  thread_id UUID,
  parent_message_id UUID REFERENCES public.patient_messages(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_patient_messages_patient ON public.patient_messages(patient_id);
CREATE INDEX idx_patient_messages_provider ON public.patient_messages(provider_id);
CREATE INDEX idx_patient_messages_clinic ON public.patient_messages(clinic_id);
CREATE INDEX idx_patient_messages_thread ON public.patient_messages(thread_id);
CREATE INDEX idx_patient_messages_status ON public.patient_messages(status);
CREATE INDEX idx_patient_messages_created ON public.patient_messages(created_at DESC);

-- Row Level Security
ALTER TABLE public.patient_messages ENABLE ROW LEVEL SECURITY;

-- Policies: Patients can view their own messages
CREATE POLICY "Patients can view own messages"
  ON public.patient_messages FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM public.patients WHERE user_id = auth.uid()
    )
  );

-- Policies: Patients can send messages
CREATE POLICY "Patients can send messages"
  ON public.patient_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    patient_id IN (
      SELECT id FROM public.patients WHERE user_id = auth.uid()
    )
  );

-- Policies: Clinic providers can view patient messages
CREATE POLICY "Clinic providers can view patient messages"
  ON public.patient_messages FOR SELECT
  TO authenticated
  USING (public.is_clinic_member(clinic_id, auth.uid()));

-- Policies: Clinic providers can reply to messages
CREATE POLICY "Clinic providers can reply to messages"
  ON public.patient_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_clinic_member(clinic_id, auth.uid())
    AND provider_id IS NOT NULL
  );

-- Trigger for updated_at
CREATE TRIGGER update_patient_messages_updated_at
  BEFORE UPDATE ON public.patient_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Patient Feedback Table
CREATE TABLE public.patient_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  
  -- Ratings
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  provider_rating INTEGER CHECK (provider_rating >= 1 AND provider_rating <= 5),
  staff_rating INTEGER CHECK (staff_rating >= 1 AND staff_rating <= 5),
  facility_rating INTEGER CHECK (facility_rating >= 1 AND facility_rating <= 5),
  
  -- Feedback
  what_went_well TEXT,
  what_could_improve TEXT,
  would_recommend BOOLEAN,
  
  -- Sentiment Analysis (AI)
  sentiment_score DECIMAL(3,2),
  sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'neutral', 'negative')),
  key_topics JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_patient_feedback_patient ON public.patient_feedback(patient_id);
CREATE INDEX idx_patient_feedback_clinic ON public.patient_feedback(clinic_id);
CREATE INDEX idx_patient_feedback_appointment ON public.patient_feedback(appointment_id);
CREATE INDEX idx_patient_feedback_created ON public.patient_feedback(created_at DESC);

-- Row Level Security
ALTER TABLE public.patient_feedback ENABLE ROW LEVEL SECURITY;

-- Policies: Patients can view their own feedback
CREATE POLICY "Patients can view own feedback"
  ON public.patient_feedback FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM public.patients WHERE user_id = auth.uid()
    )
  );

-- Policies: Patients can submit feedback
CREATE POLICY "Patients can submit feedback"
  ON public.patient_feedback FOR INSERT
  TO authenticated
  WITH CHECK (
    patient_id IN (
      SELECT id FROM public.patients WHERE user_id = auth.uid()
    )
  );

-- Policies: Clinic members can view patient feedback
CREATE POLICY "Clinic members can view patient feedback"
  ON public.patient_feedback FOR SELECT
  TO authenticated
  USING (public.is_clinic_member(clinic_id, auth.uid()));

-- Function to get patient message threads
CREATE OR REPLACE FUNCTION public.get_patient_message_threads(
  p_patient_id UUID
)
RETURNS TABLE (
  thread_id UUID,
  subject TEXT,
  message_type TEXT,
  status TEXT,
  priority TEXT,
  last_message_at TIMESTAMPTZ,
  message_count BIGINT,
  unread_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(thread_id, id) as thread_id,
    COALESCE(subject, 'Sans sujet') as subject,
    message_type,
    status,
    priority,
    MAX(created_at) as last_message_at,
    COUNT(*) as message_count,
    SUM(CASE WHEN status = 'unread' THEN 1 ELSE 0 END) as unread_count
  FROM public.patient_messages
  WHERE patient_id = p_patient_id
  GROUP BY COALESCE(thread_id, id), subject, message_type, status, priority
  ORDER BY MAX(created_at) DESC;
$$;

REVOKE EXECUTE ON FUNCTION public.get_patient_message_threads FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_patient_message_threads TO authenticated;

-- Function to mark message as read
CREATE OR REPLACE FUNCTION public.mark_message_as_read(
  p_message_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.patient_messages
  SET 
    status = 'read',
    read_at = now(),
    updated_at = now()
  WHERE id = p_message_id
    AND patient_id IN (
      SELECT id FROM public.patients WHERE user_id = auth.uid()
    );
  
  RETURN FOUND;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mark_message_as_read FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_message_as_read TO authenticated;
