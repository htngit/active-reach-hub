
-- Drop existing storage policies that aren't working properly
DROP POLICY IF EXISTS "Team owners can upload company assets" ON storage.objects;
DROP POLICY IF EXISTS "Team members can view company assets" ON storage.objects;
DROP POLICY IF EXISTS "Team owners can update company assets" ON storage.objects;
DROP POLICY IF EXISTS "Team owners can delete company assets" ON storage.objects;

-- Create new storage policies with corrected logic
CREATE POLICY "Team owners can upload company assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'company-assets' 
  AND EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id::text = (storage.foldername(name))[1]
    AND t.owner_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view company assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-assets');

CREATE POLICY "Team owners can update company assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'company-assets'
  AND EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id::text = (storage.foldername(name))[1]
    AND t.owner_id = auth.uid()
  )
);

CREATE POLICY "Team owners can delete company assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'company-assets'
  AND EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id::text = (storage.foldername(name))[1]
    AND t.owner_id = auth.uid()
  )
);
