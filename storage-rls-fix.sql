-- RLS Policies for item-pictures storage bucket
-- Run this in Supabase SQL Editor

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload to item-pictures" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to read item-pictures" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update item-pictures" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete item-pictures" ON storage.objects;

-- Policy 1: Allow authenticated users to upload to item-pictures bucket
CREATE POLICY "Allow authenticated users to upload to item-pictures"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'item-pictures');

-- Policy 2: Allow public read access to item-pictures bucket
CREATE POLICY "Allow public to read item-pictures"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'item-pictures');

-- Policy 3: Allow authenticated users to update their uploads
CREATE POLICY "Allow authenticated users to update item-pictures"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'item-pictures')
WITH CHECK (bucket_id = 'item-pictures');

-- Policy 4: Allow authenticated users to delete their uploads
CREATE POLICY "Allow authenticated users to delete item-pictures"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'item-pictures');
