-- Fix appointment triggers using wrong column names (date/time vs appointment_date/appointment_time)
CREATE OR REPLACE FUNCTION public.notify_new_appointment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, clinic_id, type, title, message, link, related_id, related_type)
  VALUES (
    NEW.user_id,
    NEW.clinic_id,
    'appointment',
    'Nouveau rendez-vous',
    'RDV avec ' || COALESCE(NEW.patient_name, 'patient')
      || ' le ' || to_char(NEW.date::date, 'DD/MM/YYYY')
      || ' à ' || COALESCE(NEW.time::text, ''),
    '/appointments',
    NEW.id,
    'appointment'
  );
  RETURN NEW;
END;
$$;

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
    WHERE a.date = (CURRENT_DATE + INTERVAL '1 day')::date
      AND COALESCE(a.status, 'scheduled') NOT IN ('cancelled', 'annule', 'termine', 'completed')
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

-- Ensure platform owner retains super_admin access
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'super_admin'::public.app_role
FROM auth.users u
WHERE lower(u.email) = 'agenceedigit@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Ensure a profile exists so super-admin UI can load
INSERT INTO public.profiles (user_id, first_name, last_name)
SELECT u.id, 'Agence', 'Edigit'
FROM auth.users u
WHERE lower(u.email) = 'agenceedigit@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.user_id = u.id
  );
