ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL;
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON public.medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON public.prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_patient_id ON public.payments(patient_id);

UPDATE public.appointments a SET patient_id = p.id FROM public.patients p WHERE a.patient_id IS NULL AND p.clinic_id = a.clinic_id AND p.name = a.patient_name;
UPDATE public.medical_records m SET patient_id = p.id FROM public.patients p WHERE m.patient_id IS NULL AND p.clinic_id = m.clinic_id AND p.name = m.patient_name;
UPDATE public.prescriptions r SET patient_id = p.id FROM public.patients p WHERE r.patient_id IS NULL AND p.clinic_id = r.clinic_id AND p.name = r.patient_name;
UPDATE public.payments y SET patient_id = p.id FROM public.patients p WHERE y.patient_id IS NULL AND p.clinic_id = y.clinic_id AND p.name = y.patient_name;