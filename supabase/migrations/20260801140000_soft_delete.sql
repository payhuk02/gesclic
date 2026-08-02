-- Soft Delete Implementation
-- Enterprise-grade soft delete following Stripe/Shopify patterns
-- Allows recovery of deleted data and maintains audit trail

-- Add deleted_at column to all main tables
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.lab_results ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.pharmacy_stock ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.clinic_members ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add deleted_by column for audit trail
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);
ALTER TABLE public.lab_results ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);
ALTER TABLE public.pharmacy_stock ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);
ALTER TABLE public.clinic_members ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Add deletion_reason column
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS deletion_reason TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS deletion_reason TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS deletion_reason TEXT;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS deletion_reason TEXT;
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS deletion_reason TEXT;
ALTER TABLE public.lab_results ADD COLUMN IF NOT EXISTS deletion_reason TEXT;
ALTER TABLE public.pharmacy_stock ADD COLUMN IF NOT EXISTS deletion_reason TEXT;
ALTER TABLE public.clinic_members ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Create indexes for soft delete queries
CREATE INDEX IF NOT EXISTS idx_patients_deleted_at ON public.patients(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_deleted_at ON public.appointments(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_deleted_at ON public.payments(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prescriptions_deleted_at ON public.prescriptions(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_medical_records_deleted_at ON public.medical_records(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lab_results_deleted_at ON public.lab_results(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pharmacy_stock_deleted_at ON public.pharmacy_stock(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clinic_members_deleted_at ON public.clinic_members(deleted_at) WHERE deleted_at IS NOT NULL;

-- Update RLS policies to exclude deleted records
DROP POLICY IF EXISTS "Users can view their own clinic patients" ON public.patients;
CREATE POLICY "Users can view their own clinic patients" ON public.patients
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM clinic_members 
      WHERE clinic_id = patients.clinic_id AND is_active = true
    )
    AND patients.deleted_at IS NULL
  );

DROP POLICY IF EXISTS "Users can view clinic appointments" ON public.appointments;
CREATE POLICY "Users can view clinic appointments" ON public.appointments
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM clinic_members 
      WHERE clinic_id = appointments.clinic_id AND is_active = true
    )
    AND appointments.deleted_at IS NULL
  );

-- Create soft delete function
CREATE OR REPLACE FUNCTION public.soft_delete(
  table_name TEXT,
  record_id UUID,
  user_id UUID,
  reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sql_query TEXT;
BEGIN
  sql_query := format(
    'UPDATE %I SET deleted_at = NOW(), deleted_by = %L, deletion_reason = %L WHERE id = %L',
    table_name, user_id, reason, record_id
  );
  
  EXECUTE sql_query;
  
  -- Log the deletion
  INSERT INTO audit_logs (clinic_id, user_id, action, resource_type, resource_id, success)
  SELECT 
    clinic_id, 
    user_id, 
    'soft_delete',
    table_name,
    record_id::TEXT,
    true
  FROM clinic_members 
  WHERE user_id = user_id AND is_active = true
  LIMIT 1;
  
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

-- Create restore function
CREATE OR REPLACE FUNCTION public.restore_record(
  table_name TEXT,
  record_id UUID,
  user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sql_query TEXT;
BEGIN
  sql_query := format(
    'UPDATE %I SET deleted_at = NULL, deleted_by = NULL, deletion_reason = NULL WHERE id = %L',
    table_name, record_id
  );
  
  EXECUTE sql_query;
  
  -- Log the restoration
  INSERT INTO audit_logs (clinic_id, user_id, action, resource_type, resource_id, success)
  SELECT 
    clinic_id, 
    user_id, 
    'restore_record',
    table_name,
    record_id::TEXT,
    true
  FROM clinic_members 
  WHERE user_id = user_id AND is_active = true
  LIMIT 1;
  
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

-- Create view for active records (excludes deleted)
CREATE OR REPLACE VIEW public.active_patients AS
SELECT * FROM public.patients WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW public.active_appointments AS
SELECT * FROM public.appointments WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW public.active_payments AS
SELECT * FROM public.payments WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW public.active_prescriptions AS
SELECT * FROM public.prescriptions WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW public.active_medical_records AS
SELECT * FROM public.medical_records WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW public.active_lab_results AS
SELECT * FROM public.lab_results WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW public.active_pharmacy_stock AS
SELECT * FROM public.pharmacy_stock WHERE deleted_at IS NULL;

-- Create view for deleted records (for admin/recovery)
CREATE OR REPLACE VIEW public.deleted_patients AS
SELECT * FROM public.patients WHERE deleted_at IS NOT NULL;

CREATE OR REPLACE VIEW public.deleted_appointments AS
SELECT * FROM public.appointments WHERE deleted_at IS NOT NULL;

CREATE OR REPLACE VIEW public.deleted_payments AS
SELECT * FROM public.payments WHERE deleted_at IS NOT NULL;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.soft_delete TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_record TO authenticated;

-- Soft delete pattern for data recovery and audit trail