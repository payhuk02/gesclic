
-- =========================================================================
-- MULTI-TENANCY MIGRATION
-- =========================================================================

-- 1. CLINICS TABLE ---------------------------------------------------------
CREATE TABLE public.clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','enterprise')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','archived')),
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinics TO authenticated;
GRANT ALL ON public.clinics TO service_role;
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_clinics_updated_at BEFORE UPDATE ON public.clinics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. CLINIC MEMBERS TABLE --------------------------------------------------
CREATE TABLE public.clinic_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'medecin',
  is_active boolean NOT NULL DEFAULT true,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, user_id)
);
CREATE INDEX idx_clinic_members_user ON public.clinic_members(user_id) WHERE is_active;
CREATE INDEX idx_clinic_members_clinic ON public.clinic_members(clinic_id) WHERE is_active;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinic_members TO authenticated;
GRANT ALL ON public.clinic_members TO service_role;
ALTER TABLE public.clinic_members ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_clinic_members_updated_at BEFORE UPDATE ON public.clinic_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. HELPER FUNCTIONS (SECURITY DEFINER, no recursion) ---------------------
CREATE OR REPLACE FUNCTION public.is_clinic_member(_clinic_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clinic_members
    WHERE clinic_id = _clinic_id AND user_id = _user_id AND is_active
  )
$$;
REVOKE EXECUTE ON FUNCTION public.is_clinic_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_clinic_member(uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.has_clinic_role(_clinic_id uuid, _user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clinic_members
    WHERE clinic_id = _clinic_id AND user_id = _user_id AND role = _role AND is_active
  )
$$;
REVOKE EXECUTE ON FUNCTION public.has_clinic_role(uuid, uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_clinic_role(uuid, uuid, public.app_role) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.user_clinic_ids(_user_id uuid)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT clinic_id FROM public.clinic_members
  WHERE user_id = _user_id AND is_active
$$;
REVOKE EXECUTE ON FUNCTION public.user_clinic_ids(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_clinic_ids(uuid) TO authenticated, service_role;

-- 4. RLS POLICIES FOR CLINICS & MEMBERS ------------------------------------
CREATE POLICY "Members can view their clinics" ON public.clinics
  FOR SELECT TO authenticated
  USING (public.is_clinic_member(id, auth.uid()));

CREATE POLICY "Authenticated users can create clinics" ON public.clinics
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Clinic admins can update their clinic" ON public.clinics
  FOR UPDATE TO authenticated
  USING (public.has_clinic_role(id, auth.uid(), 'admin'))
  WITH CHECK (public.has_clinic_role(id, auth.uid(), 'admin'));

CREATE POLICY "Clinic admins can delete their clinic" ON public.clinics
  FOR DELETE TO authenticated
  USING (public.has_clinic_role(id, auth.uid(), 'admin'));

CREATE POLICY "Members can view co-members" ON public.clinic_members
  FOR SELECT TO authenticated
  USING (public.is_clinic_member(clinic_id, auth.uid()));

CREATE POLICY "Clinic admins can add members" ON public.clinic_members
  FOR INSERT TO authenticated
  WITH CHECK (public.has_clinic_role(clinic_id, auth.uid(), 'admin'));

CREATE POLICY "Clinic admins can update members" ON public.clinic_members
  FOR UPDATE TO authenticated
  USING (public.has_clinic_role(clinic_id, auth.uid(), 'admin'))
  WITH CHECK (public.has_clinic_role(clinic_id, auth.uid(), 'admin'));

CREATE POLICY "Clinic admins can remove members" ON public.clinic_members
  FOR DELETE TO authenticated
  USING (public.has_clinic_role(clinic_id, auth.uid(), 'admin'));

-- Bootstrap: allow creator to insert their own admin membership row right after clinic creation
CREATE POLICY "Creator can add themselves as first member" ON public.clinic_members
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.clinics c WHERE c.id = clinic_id AND c.created_by = auth.uid())
  );

-- 5. ADD clinic_id TO ALL BUSINESS TABLES ----------------------------------
ALTER TABLE public.patients        ADD COLUMN clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE;
ALTER TABLE public.appointments    ADD COLUMN clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE;
ALTER TABLE public.prescriptions   ADD COLUMN clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE;
ALTER TABLE public.lab_results     ADD COLUMN clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE;
ALTER TABLE public.medical_records ADD COLUMN clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE;
ALTER TABLE public.payments        ADD COLUMN clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE;
ALTER TABLE public.pharmacy_stock  ADD COLUMN clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE;
ALTER TABLE public.doctors         ADD COLUMN clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE;
ALTER TABLE public.notifications   ADD COLUMN clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE;

-- Since tables are empty, safe to set NOT NULL immediately
ALTER TABLE public.patients        ALTER COLUMN clinic_id SET NOT NULL;
ALTER TABLE public.appointments    ALTER COLUMN clinic_id SET NOT NULL;
ALTER TABLE public.prescriptions   ALTER COLUMN clinic_id SET NOT NULL;
ALTER TABLE public.lab_results     ALTER COLUMN clinic_id SET NOT NULL;
ALTER TABLE public.medical_records ALTER COLUMN clinic_id SET NOT NULL;
ALTER TABLE public.payments        ALTER COLUMN clinic_id SET NOT NULL;
ALTER TABLE public.pharmacy_stock  ALTER COLUMN clinic_id SET NOT NULL;
ALTER TABLE public.doctors         ALTER COLUMN clinic_id SET NOT NULL;
-- notifications can be system-wide (nullable clinic_id allowed for platform notifs)

CREATE INDEX idx_patients_clinic        ON public.patients(clinic_id);
CREATE INDEX idx_appointments_clinic    ON public.appointments(clinic_id);
CREATE INDEX idx_prescriptions_clinic   ON public.prescriptions(clinic_id);
CREATE INDEX idx_lab_results_clinic     ON public.lab_results(clinic_id);
CREATE INDEX idx_medical_records_clinic ON public.medical_records(clinic_id);
CREATE INDEX idx_payments_clinic        ON public.payments(clinic_id);
CREATE INDEX idx_pharmacy_stock_clinic  ON public.pharmacy_stock(clinic_id);
CREATE INDEX idx_doctors_clinic         ON public.doctors(clinic_id);
CREATE INDEX idx_notifications_clinic   ON public.notifications(clinic_id);

-- 6. DROP OLD user-scoped POLICIES -----------------------------------------
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can insert their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can delete their own appointments" ON public.appointments;

DROP POLICY IF EXISTS "Users can view their own patients" ON public.patients;
DROP POLICY IF EXISTS "Users can insert their own patients" ON public.patients;
DROP POLICY IF EXISTS "Users can update their own patients" ON public.patients;
DROP POLICY IF EXISTS "Users can delete their own patients" ON public.patients;

DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can delete their own payments" ON public.payments;

DROP POLICY IF EXISTS "Users manage own doctors" ON public.doctors;
DROP POLICY IF EXISTS "Users manage own lab_results" ON public.lab_results;
DROP POLICY IF EXISTS "Users manage own medical_records" ON public.medical_records;
DROP POLICY IF EXISTS "Users manage own pharmacy_stock" ON public.pharmacy_stock;
DROP POLICY IF EXISTS "Users manage own prescriptions" ON public.prescriptions;

DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users delete own notifications" ON public.notifications;

-- 7. NEW clinic-scoped POLICIES --------------------------------------------
-- Pattern: any member of the clinic can CRUD (fine-grained per-role can be layered later)

-- PATIENTS
CREATE POLICY "Clinic members view patients" ON public.patients FOR SELECT TO authenticated
  USING (public.is_clinic_member(clinic_id, auth.uid()));
CREATE POLICY "Clinic members insert patients" ON public.patients FOR INSERT TO authenticated
  WITH CHECK (public.is_clinic_member(clinic_id, auth.uid()));
CREATE POLICY "Clinic members update patients" ON public.patients FOR UPDATE TO authenticated
  USING (public.is_clinic_member(clinic_id, auth.uid()))
  WITH CHECK (public.is_clinic_member(clinic_id, auth.uid()));
CREATE POLICY "Clinic members delete patients" ON public.patients FOR DELETE TO authenticated
  USING (public.is_clinic_member(clinic_id, auth.uid()));

-- APPOINTMENTS
CREATE POLICY "Clinic members view appointments" ON public.appointments FOR SELECT TO authenticated
  USING (public.is_clinic_member(clinic_id, auth.uid()));
CREATE POLICY "Clinic members insert appointments" ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (public.is_clinic_member(clinic_id, auth.uid()));
CREATE POLICY "Clinic members update appointments" ON public.appointments FOR UPDATE TO authenticated
  USING (public.is_clinic_member(clinic_id, auth.uid()))
  WITH CHECK (public.is_clinic_member(clinic_id, auth.uid()));
CREATE POLICY "Clinic members delete appointments" ON public.appointments FOR DELETE TO authenticated
  USING (public.is_clinic_member(clinic_id, auth.uid()));

-- PRESCRIPTIONS
CREATE POLICY "Clinic members manage prescriptions" ON public.prescriptions FOR ALL TO authenticated
  USING (public.is_clinic_member(clinic_id, auth.uid()))
  WITH CHECK (public.is_clinic_member(clinic_id, auth.uid()));

-- LAB RESULTS
CREATE POLICY "Clinic members manage lab_results" ON public.lab_results FOR ALL TO authenticated
  USING (public.is_clinic_member(clinic_id, auth.uid()))
  WITH CHECK (public.is_clinic_member(clinic_id, auth.uid()));

-- MEDICAL RECORDS
CREATE POLICY "Clinic members manage medical_records" ON public.medical_records FOR ALL TO authenticated
  USING (public.is_clinic_member(clinic_id, auth.uid()))
  WITH CHECK (public.is_clinic_member(clinic_id, auth.uid()));

-- PAYMENTS
CREATE POLICY "Clinic members manage payments" ON public.payments FOR ALL TO authenticated
  USING (public.is_clinic_member(clinic_id, auth.uid()))
  WITH CHECK (public.is_clinic_member(clinic_id, auth.uid()));

-- PHARMACY STOCK
CREATE POLICY "Clinic members manage pharmacy_stock" ON public.pharmacy_stock FOR ALL TO authenticated
  USING (public.is_clinic_member(clinic_id, auth.uid()))
  WITH CHECK (public.is_clinic_member(clinic_id, auth.uid()));

-- DOCTORS
CREATE POLICY "Clinic members manage doctors" ON public.doctors FOR ALL TO authenticated
  USING (public.is_clinic_member(clinic_id, auth.uid()))
  WITH CHECK (public.is_clinic_member(clinic_id, auth.uid()));

-- NOTIFICATIONS: user-scoped, but must belong to a clinic the user is in (if clinic_id set)
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own notifications" ON public.notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "System inserts notifications" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR clinic_id IS NULL OR public.is_clinic_member(clinic_id, auth.uid()));

-- 8. UPDATED PROFILES POLICY (visibility across clinic co-members) ---------
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users view own or co-member profiles" ON public.profiles FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.clinic_members cm1
      JOIN public.clinic_members cm2 ON cm1.clinic_id = cm2.clinic_id
      WHERE cm1.user_id = auth.uid() AND cm2.user_id = profiles.user_id
        AND cm1.is_active AND cm2.is_active
    )
  );

-- 9. NEW SIGNUP TRIGGER: create default clinic + admin membership ----------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_clinic_id uuid;
  v_clinic_name text;
  v_slug text;
BEGIN
  -- Profile
  INSERT INTO public.profiles (user_id, first_name, last_name, clinic_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'clinic_name', '')
  );

  -- Default clinic (self-service)
  v_clinic_name := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'clinic_name', '')), '');
  IF v_clinic_name IS NULL THEN
    v_clinic_name := 'Ma clinique';
  END IF;

  v_slug := lower(regexp_replace(v_clinic_name, '[^a-zA-Z0-9]+', '-', 'g'))
            || '-' || substr(replace(NEW.id::text, '-', ''), 1, 8);

  INSERT INTO public.clinics (name, slug, created_by)
  VALUES (v_clinic_name, v_slug, NEW.id)
  RETURNING id INTO v_clinic_id;

  -- Membership as admin
  INSERT INTO public.clinic_members (clinic_id, user_id, role)
  VALUES (v_clinic_id, NEW.id, 'admin');

  -- Legacy user_roles (kept for backward compat with existing has_role checks)
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Re-attach trigger on auth.users (drop first to be idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. UPDATE notify_new_appointment trigger to set clinic-scoped notif -----
CREATE OR REPLACE FUNCTION public.notify_new_appointment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, clinic_id, type, title, message, link, related_id, related_type)
  VALUES (
    NEW.user_id,
    NEW.clinic_id,
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
