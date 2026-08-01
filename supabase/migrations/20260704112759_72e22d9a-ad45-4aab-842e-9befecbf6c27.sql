
-- Any authenticated user can read clinic logos (needed for invite preview + header)
CREATE POLICY "Authenticated can read clinic logos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'clinic-logos');

-- Only clinic admins can upload/update/delete a logo (path prefix = clinic id)
CREATE POLICY "Clinic admins can upload clinic logos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'clinic-logos'
    AND public.has_clinic_role(
      ((storage.foldername(name))[1])::uuid,
      auth.uid(),
      'admin'::public.app_role
    )
  );

CREATE POLICY "Clinic admins can update clinic logos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'clinic-logos'
    AND public.has_clinic_role(
      ((storage.foldername(name))[1])::uuid,
      auth.uid(),
      'admin'::public.app_role
    )
  );

CREATE POLICY "Clinic admins can delete clinic logos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'clinic-logos'
    AND public.has_clinic_role(
      ((storage.foldername(name))[1])::uuid,
      auth.uid(),
      'admin'::public.app_role
    )
  );
