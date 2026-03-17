-- Migration 011: Allow public read access for stamp images in storage
-- The invoices storage bucket must exist (created in Supabase dashboard).
-- This migration ensures the bucket is registered and adds a public read
-- policy restricted to the stamps/ folder only.

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
