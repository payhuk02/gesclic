-- Allow clinic logos up to 5 MB
UPDATE storage.buckets
SET file_size_limit = 5242880
WHERE id = 'clinic-logos';
