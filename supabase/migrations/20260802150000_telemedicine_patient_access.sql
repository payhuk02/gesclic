-- Allow patients linked via patients.user_id to view their own telemedicine sessions
CREATE POLICY "Patients can view their own telemedicine sessions"
  ON public.telemedicine_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = telemedicine_sessions.patient_id
        AND p.user_id = auth.uid()
    )
  );
