-- Migration 011: Create a dedicated public bucket for stamp images
-- A separate public bucket avoids exposing invoice files while allowing
-- stamp images to be loaded directly via public URLs.

-- Create the public stamps bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('stamps', 'stamps', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow anyone to read stamps (public bucket)
DROP POLICY IF EXISTS "Public read stamps" ON storage.objects;
CREATE POLICY "Public read stamps"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'stamps');

-- Allow authenticated users to upload stamps
DROP POLICY IF EXISTS "Authenticated upload stamps" ON storage.objects;
CREATE POLICY "Authenticated upload stamps"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'stamps');

-- Allow authenticated users to update/overwrite stamps
DROP POLICY IF EXISTS "Authenticated update stamps" ON storage.objects;
CREATE POLICY "Authenticated update stamps"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'stamps');

-- Allow authenticated users to delete stamps
DROP POLICY IF EXISTS "Authenticated delete stamps" ON storage.objects;
CREATE POLICY "Authenticated delete stamps"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'stamps');
