CREATE TABLE public.telemedicine_room_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES public.telemedicine_sessions(id) ON DELETE SET NULL,
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE,
  room_name text,
  event_type text NOT NULL,
  reason text,
  actor_user_id uuid,
  actor_role text,
  scheduled_start timestamp with time zone,
  scheduled_end timestamp with time zone,
  actual_end timestamp with time zone,
  room_exp timestamp with time zone,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_tre_session ON public.telemedicine_room_events (session_id, created_at DESC);
CREATE INDEX idx_tre_clinic ON public.telemedicine_room_events (clinic_id, created_at DESC);

GRANT SELECT ON public.telemedicine_room_events TO authenticated;
GRANT ALL ON public.telemedicine_room_events TO service_role;

ALTER TABLE public.telemedicine_room_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic members can view room events"
ON public.telemedicine_room_events
FOR SELECT
TO authenticated
USING (clinic_id IN (SELECT public.user_clinic_ids(auth.uid())));