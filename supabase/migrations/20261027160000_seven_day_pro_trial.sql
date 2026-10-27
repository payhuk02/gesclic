-- 7-day Pro trial for new clinics
ALTER TABLE public.clinics
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_ends_at timestamptz;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_clinic_id uuid;
  v_clinic_name text;
  v_slug text;
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, clinic_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'clinic_name', '')
  );

  v_clinic_name := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'clinic_name', '')), '');
  IF v_clinic_name IS NULL THEN
    v_clinic_name := 'Ma clinique';
  END IF;

  v_slug := lower(regexp_replace(v_clinic_name, '[^a-zA-Z0-9]+', '-', 'g'))
            || '-' || substr(replace(NEW.id::text, '-', ''), 1, 8);

  INSERT INTO public.clinics (name, slug, created_by, plan, trial_ends_at)
  VALUES (v_clinic_name, v_slug, NEW.id, 'pro', now() + interval '7 days')
  RETURNING id INTO v_clinic_id;

  INSERT INTO public.clinic_members (clinic_id, user_id, role)
  VALUES (v_clinic_id, NEW.id, 'admin');

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;
