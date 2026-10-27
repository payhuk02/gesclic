-- Lab results linked by patient UUID (other clinical tables already have patient_id)
ALTER TABLE public.lab_results ADD COLUMN IF NOT EXISTS patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_lab_results_patient_id ON public.lab_results(patient_id);
UPDATE public.lab_results l
SET patient_id = p.id
FROM public.patients p
WHERE l.patient_id IS NULL AND p.clinic_id = l.clinic_id AND p.name = l.patient_name;

-- Public read of non-secret platform policy (needed before/at login)
DROP POLICY IF EXISTS "Anon can read public platform settings" ON public.platform_settings;
CREATE POLICY "Anon can read public platform settings"
  ON public.platform_settings FOR SELECT TO anon
  USING (key IN ('security', 'general'));
