-- 1. Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  related_id UUID,
  related_type TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, read, created_at DESC);

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- 3. Auto-notify on new appointment
CREATE OR REPLACE FUNCTION public.notify_new_appointment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link, related_id, related_type)
  VALUES (
    NEW.user_id,
    'appointment',
    'Nouveau rendez-vous',
    'RDV avec ' || COALESCE(NEW.patient_name, 'patient') || ' le ' || to_char(NEW.appointment_date, 'DD/MM/YYYY') || ' à ' || COALESCE(NEW.appointment_time::text, ''),
    '/appointments',
    NEW.id,
    'appointment'
  );
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_new_appointment() FROM public, authenticated;

CREATE TRIGGER trg_notify_new_appointment
  AFTER INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_appointment();

-- 4. Generate 24h reminders (call periodically from an edge function / cron)
CREATE OR REPLACE FUNCTION public.generate_appointment_reminders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  r RECORD;
BEGIN
  FOR r IN
    SELECT a.*
    FROM public.appointments a
    WHERE a.appointment_date = (CURRENT_DATE + INTERVAL '1 day')::date
      AND COALESCE(a.status, 'planifie') NOT IN ('annule', 'termine')
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.related_id = a.id
          AND n.related_type = 'appointment'
          AND n.type = 'reminder'
      )
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, link, related_id, related_type)
    VALUES (
      r.user_id,
      'reminder',
      'Rappel : RDV demain',
      COALESCE(r.patient_name, 'Patient') || ' — ' || COALESCE(r.appointment_time::text, '') || ' (' || COALESCE(r.reason, 'consultation') || ')',
      '/appointments',
      r.id,
      'appointment'
    );
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.generate_appointment_reminders() FROM public, authenticated;