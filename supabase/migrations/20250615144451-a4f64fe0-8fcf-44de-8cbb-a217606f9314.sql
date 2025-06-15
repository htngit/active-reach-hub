
-- First, ensure the company-assets bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop all existing policies for company-assets bucket
DROP POLICY IF EXISTS "Team owners can upload company assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view company assets" ON storage.objects;
DROP POLICY IF EXISTS "Team members can view company assets" ON storage.objects;
DROP POLICY IF EXISTS "Team owners can update company assets" ON storage.objects;
DROP POLICY IF EXISTS "Team owners can delete company assets" ON storage.objects;

-- Create a more permissive upload policy for testing
CREATE POLICY "Allow uploads to company-assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'company-assets');

-- Allow anyone to view company assets (since logos should be public)
CREATE POLICY "Allow viewing company assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-assets');

-- Allow updates to company assets for authenticated users
CREATE POLICY "Allow updates to company-assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'company-assets' AND auth.uid() IS NOT NULL);

-- Allow deletes to company assets for authenticated users
CREATE POLICY "Allow deletes from company-assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'company-assets' AND auth.uid() IS NOT NULL);
