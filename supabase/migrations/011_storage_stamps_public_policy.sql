-- Migration 011: Storage policies for the invoices bucket
-- The invoices storage bucket must exist (created in Supabase dashboard).
-- This migration ensures the bucket is registered and adds:
--   - public read policy for stamps/ folder
--   - authenticated upload/update/delete policy for stamps/ folder

-- Ensure the invoices bucket exists (non-public by default to protect invoices)
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Allow anonymous/public SELECT on stamps only
DROP POLICY IF EXISTS "Public read stamps" ON storage.objects;
CREATE POLICY "Public read stamps"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'invoices' AND name LIKE 'stamps/%');

-- Allow authenticated users to upload stamps
DROP POLICY IF EXISTS "Authenticated upload stamps" ON storage.objects;
CREATE POLICY "Authenticated upload stamps"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'invoices' AND name LIKE 'stamps/%');

-- Allow authenticated users to update/overwrite stamps (upsert: true)
DROP POLICY IF EXISTS "Authenticated update stamps" ON storage.objects;
CREATE POLICY "Authenticated update stamps"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'invoices' AND name LIKE 'stamps/%');

-- Allow authenticated users to delete stamps
DROP POLICY IF EXISTS "Authenticated delete stamps" ON storage.objects;
CREATE POLICY "Authenticated delete stamps"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'invoices' AND name LIKE 'stamps/%');
