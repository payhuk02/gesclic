-- Ensure the clinic-logos bucket exists (policies were added without creating it)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'clinic-logos',
  'clinic-logos',
  true,
  5242880,
  ARRAY[
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/gif',
    'image/svg+xml'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can read clinic logos" ON storage.objects;
CREATE POLICY "Public can read clinic logos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'clinic-logos');

DROP POLICY IF EXISTS "Clinic admins can update clinic logos" ON storage.objects;
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
  )
  WITH CHECK (
    bucket_id = 'clinic-logos'
    AND public.has_clinic_role(
      ((storage.foldername(name))[1])::uuid,
      auth.uid(),
      'admin'::public.app_role
    )
  );
