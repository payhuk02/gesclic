-- Respect clinic notification preferences for 24h appointment reminders

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
    INNER JOIN public.clinics c ON c.id = a.clinic_id
    WHERE a.date = (CURRENT_DATE + INTERVAL '1 day')::date
      AND COALESCE(a.status, 'scheduled') NOT IN ('cancelled', 'annule', 'termine', 'completed')
      AND COALESCE((c.settings->'notifications'->>'reminder24h')::boolean, true) = true
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.related_id = a.id
          AND n.related_type = 'appointment'
          AND n.type = 'reminder'
      )
  LOOP
    INSERT INTO public.notifications (user_id, clinic_id, type, title, message, link, related_id, related_type)
    VALUES (
      r.user_id,
      r.clinic_id,
      'reminder',
      'Rappel : RDV demain',
      COALESCE(r.patient_name, 'Patient') || ' — ' || COALESCE(r.time::text, '')
        || ' (' || COALESCE(r.type, 'consultation') || ')',
      '/appointments',
      r.id,
      'appointment'
    );
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;
