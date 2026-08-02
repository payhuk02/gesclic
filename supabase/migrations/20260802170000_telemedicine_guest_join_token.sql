-- Secure guest join link for patients without a Gesclic account
ALTER TABLE public.telemedicine_sessions
  ADD COLUMN IF NOT EXISTS patient_join_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS idx_telemedicine_sessions_patient_join_token
  ON public.telemedicine_sessions (patient_join_token);
