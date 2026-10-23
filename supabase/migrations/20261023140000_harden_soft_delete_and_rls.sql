-- Harden soft_delete / restore_record and unify clinic RLS (exclude soft-deleted rows)

-- 0) Drop legacy user_id-scoped policies if still present
DROP POLICY IF EXISTS "Users manage own prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Users manage own medical_records" ON public.medical_records;
DROP POLICY IF EXISTS "Users manage own lab_results" ON public.lab_results;
DROP POLICY IF EXISTS "Users manage own pharmacy_stock" ON public.pharmacy_stock;
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can delete their own payments" ON public.payments;

-- 1) Drop duplicate / legacy SELECT policies that ignored deleted_at
DROP POLICY IF EXISTS "Clinic members view patients" ON public.patients;
DROP POLICY IF EXISTS "Users can view their own clinic patients" ON public.patients;
DROP POLICY IF EXISTS "Clinic members view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can view clinic appointments" ON public.appointments;

-- 2) Unified SELECT policies (clinic membership + not soft-deleted)
CREATE POLICY "Clinic members view patients" ON public.patients
  FOR SELECT TO authenticated
  USING (
    public.is_clinic_member(clinic_id, auth.uid())
    AND deleted_at IS NULL
  );

CREATE POLICY "Clinic members view appointments" ON public.appointments
  FOR SELECT TO authenticated
  USING (
    public.is_clinic_member(clinic_id, auth.uid())
    AND deleted_at IS NULL
  );

-- Apply deleted_at filter on other clinical tables if columns exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'prescriptions' AND column_name = 'deleted_at'
  ) THEN
    DROP POLICY IF EXISTS "Clinic members manage prescriptions" ON public.prescriptions;
    CREATE POLICY "Clinic members manage prescriptions" ON public.prescriptions
      FOR ALL TO authenticated
      USING (public.is_clinic_member(clinic_id, auth.uid()) AND deleted_at IS NULL)
      WITH CHECK (public.is_clinic_member(clinic_id, auth.uid()));
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'medical_records' AND column_name = 'deleted_at'
  ) THEN
    DROP POLICY IF EXISTS "Clinic members manage medical_records" ON public.medical_records;
    CREATE POLICY "Clinic members manage medical_records" ON public.medical_records
      FOR ALL TO authenticated
      USING (public.is_clinic_member(clinic_id, auth.uid()) AND deleted_at IS NULL)
      WITH CHECK (public.is_clinic_member(clinic_id, auth.uid()));
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'deleted_at'
  ) THEN
    DROP POLICY IF EXISTS "Clinic members manage payments" ON public.payments;
    DROP POLICY IF EXISTS "Clinic members view payments" ON public.payments;
    CREATE POLICY "Clinic members manage payments" ON public.payments
      FOR ALL TO authenticated
      USING (public.is_clinic_member(clinic_id, auth.uid()) AND deleted_at IS NULL)
      WITH CHECK (public.is_clinic_member(clinic_id, auth.uid()));
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lab_results' AND column_name = 'deleted_at'
  ) THEN
    DROP POLICY IF EXISTS "Clinic members manage lab_results" ON public.lab_results;
    CREATE POLICY "Clinic members manage lab_results" ON public.lab_results
      FOR ALL TO authenticated
      USING (public.is_clinic_member(clinic_id, auth.uid()) AND deleted_at IS NULL)
      WITH CHECK (public.is_clinic_member(clinic_id, auth.uid()));
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pharmacy_stock' AND column_name = 'deleted_at'
  ) THEN
    DROP POLICY IF EXISTS "Clinic members manage pharmacy_stock" ON public.pharmacy_stock;
    CREATE POLICY "Clinic members manage pharmacy_stock" ON public.pharmacy_stock
      FOR ALL TO authenticated
      USING (public.is_clinic_member(clinic_id, auth.uid()) AND deleted_at IS NULL)
      WITH CHECK (public.is_clinic_member(clinic_id, auth.uid()));
  END IF;
END $$;

-- 3) Replace dangerous dynamic soft_delete with whitelisted, membership-checked version
-- Must DROP first: CREATE OR REPLACE cannot rename input parameters (user_id -> p_user_id)
DROP FUNCTION IF EXISTS public.soft_delete(TEXT, UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.restore_record(TEXT, UUID, UUID);

CREATE OR REPLACE FUNCTION public.soft_delete(
  table_name TEXT,
  record_id UUID,
  p_user_id UUID DEFAULT auth.uid(),
  reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed TEXT[] := ARRAY[
    'patients', 'appointments', 'payments', 'prescriptions',
    'medical_records', 'lab_results', 'pharmacy_stock', 'clinic_members'
  ];
  target_clinic UUID;
  caller UUID := COALESCE(p_user_id, auth.uid());
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF table_name IS NULL OR NOT (table_name = ANY (allowed)) THEN
    RAISE EXCEPTION 'table not allowed for soft delete';
  END IF;

  IF record_id IS NULL THEN
    RAISE EXCEPTION 'record_id required';
  END IF;

  -- Resolve clinic_id of the target row
  EXECUTE format('SELECT clinic_id FROM public.%I WHERE id = $1', table_name)
    INTO target_clinic
    USING record_id;

  IF target_clinic IS NULL THEN
    RAISE EXCEPTION 'record not found';
  END IF;

  IF NOT public.is_clinic_member(target_clinic, caller) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  EXECUTE format(
    'UPDATE public.%I SET deleted_at = NOW(), deleted_by = $1, deletion_reason = $2 WHERE id = $3 AND deleted_at IS NULL',
    table_name
  ) USING caller, reason, record_id;

  INSERT INTO audit_logs (clinic_id, user_id, action, resource_type, resource_id, success)
  VALUES (target_clinic, caller, 'soft_delete', table_name, record_id::TEXT, true);

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_record(
  table_name TEXT,
  record_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed TEXT[] := ARRAY[
    'patients', 'appointments', 'payments', 'prescriptions',
    'medical_records', 'lab_results', 'pharmacy_stock', 'clinic_members'
  ];
  target_clinic UUID;
  caller UUID := COALESCE(p_user_id, auth.uid());
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF table_name IS NULL OR NOT (table_name = ANY (allowed)) THEN
    RAISE EXCEPTION 'table not allowed for restore';
  END IF;

  EXECUTE format('SELECT clinic_id FROM public.%I WHERE id = $1', table_name)
    INTO target_clinic
    USING record_id;

  IF target_clinic IS NULL THEN
    RAISE EXCEPTION 'record not found';
  END IF;

  -- Restore requires clinic admin (or platform super_admin)
  IF NOT (
    public.has_clinic_role(target_clinic, caller, 'admin')
    OR public.has_role(caller, 'super_admin')
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  EXECUTE format(
    'UPDATE public.%I SET deleted_at = NULL, deleted_by = NULL, deletion_reason = NULL WHERE id = $1',
    table_name
  ) USING record_id;

  INSERT INTO audit_logs (clinic_id, user_id, action, resource_type, resource_id, success)
  VALUES (target_clinic, caller, 'restore_record', table_name, record_id::TEXT, true);

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.soft_delete(TEXT, UUID, UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.restore_record(TEXT, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.soft_delete(TEXT, UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_record(TEXT, UUID, UUID) TO authenticated;
