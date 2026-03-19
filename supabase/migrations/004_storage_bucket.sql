-- Create storage bucket for form documents
-- Run this in Supabase SQL Editor. If bucket already exists from Dashboard, the INSERT may fail - that's OK.
-- The policies are critical for uploads to work.

INSERT INTO storage.buckets (id, name, public)
VALUES ('form-documents', 'form-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Allow uploads to form-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read form-documents" ON storage.objects;

-- Allow uploads (required for service_role and anon)
CREATE POLICY "Allow uploads to form-documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'form-documents');

-- Allow public read
CREATE POLICY "Allow public read form-documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'form-documents');
