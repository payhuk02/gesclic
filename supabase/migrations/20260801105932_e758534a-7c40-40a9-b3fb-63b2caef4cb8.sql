ALTER TABLE public.telemedicine_sessions DROP CONSTRAINT IF EXISTS telemedicine_sessions_provider_id_fkey;
ALTER TABLE public.telemedicine_sessions ADD COLUMN IF NOT EXISTS doctor_id uuid REFERENCES public.doctors(id) ON DELETE SET NULL;
ALTER TABLE public.telemedicine_sessions ADD COLUMN IF NOT EXISTS reason text;

DROP POLICY IF EXISTS "Clinic providers can insert telemedicine sessions" ON public.telemedicine_sessions;
CREATE POLICY "Clinic providers can insert telemedicine sessions"
ON public.telemedicine_sessions FOR INSERT TO authenticated
WITH CHECK (
  public.is_clinic_member(clinic_id, auth.uid())
  AND (auth.uid() = provider_id OR public.has_clinic_role(clinic_id, auth.uid(), 'admin'::app_role))
);

DROP POLICY IF EXISTS "Clinic providers can update telemedicine sessions" ON public.telemedicine_sessions;
CREATE POLICY "Clinic providers can update telemedicine sessions"
ON public.telemedicine_sessions FOR UPDATE TO authenticated
USING (
  public.is_clinic_member(clinic_id, auth.uid())
  AND (auth.uid() = provider_id OR public.has_clinic_role(clinic_id, auth.uid(), 'admin'::app_role))
)
WITH CHECK (
  public.is_clinic_member(clinic_id, auth.uid())
  AND (auth.uid() = provider_id OR public.has_clinic_role(clinic_id, auth.uid(), 'admin'::app_role))
);

GRANT SELECT, INSERT, UPDATE ON public.telemedicine_sessions TO authenticated;
GRANT ALL ON public.telemedicine_sessions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.telemedicine_settings TO authenticated;
GRANT ALL ON public.telemedicine_settings TO service_role;

INSERT INTO public.telemedicine_settings (clinic_id)
SELECT c.id FROM public.clinics c
WHERE NOT EXISTS (SELECT 1 FROM public.telemedicine_settings s WHERE s.clinic_id = c.id);