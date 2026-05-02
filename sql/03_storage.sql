-- ============================================================
-- Amuche's Oven — Supabase Storage Configuration
-- Run in Supabase SQL Editor AFTER 01_schema.sql
-- ============================================================

-- Create the cake-images storage bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cake-images',
  'cake-images',
  true,
  5242880,  -- 5MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Create receipts bucket (private — only admin downloads)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  false,
  2097152,  -- 2MB per file
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STORAGE POLICIES
-- ============================================================

-- Public can view cake images
DROP POLICY IF EXISTS "Public can view cake images in storage" ON storage.objects;
CREATE POLICY "Public can view cake images in storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cake-images');

-- Admin can upload cake images
DROP POLICY IF EXISTS "Admin can upload cake images" ON storage.objects;
CREATE POLICY "Admin can upload cake images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'cake-images'
    AND auth.role() = 'authenticated'
  );

-- Admin can delete cake images
DROP POLICY IF EXISTS "Admin can delete cake images" ON storage.objects;
CREATE POLICY "Admin can delete cake images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'cake-images'
    AND auth.role() = 'authenticated'
  );

-- Admin can update cake images
DROP POLICY IF EXISTS "Admin can update cake images" ON storage.objects;
CREATE POLICY "Admin can update cake images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'cake-images'
    AND auth.role() = 'authenticated'
  );

-- Admin can access receipts bucket
DROP POLICY IF EXISTS "Admin can access receipts" ON storage.objects;
CREATE POLICY "Admin can access receipts"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'receipts'
    AND auth.role() = 'authenticated'
  )
  WITH CHECK (
    bucket_id = 'receipts'
    AND auth.role() = 'authenticated'
  );
