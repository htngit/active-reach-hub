
-- Add company information columns to teams table
ALTER TABLE public.teams ADD COLUMN company_legal_name TEXT;
ALTER TABLE public.teams ADD COLUMN tax_id TEXT;
ALTER TABLE public.teams ADD COLUMN company_address TEXT;
ALTER TABLE public.teams ADD COLUMN city TEXT;
ALTER TABLE public.teams ADD COLUMN state TEXT;
ALTER TABLE public.teams ADD COLUMN postal_code TEXT;
ALTER TABLE public.teams ADD COLUMN country TEXT DEFAULT 'Indonesia';
ALTER TABLE public.teams ADD COLUMN company_phone TEXT;
ALTER TABLE public.teams ADD COLUMN company_email TEXT;
ALTER TABLE public.teams ADD COLUMN website TEXT;
ALTER TABLE public.teams ADD COLUMN bank_name TEXT;
ALTER TABLE public.teams ADD COLUMN bank_account TEXT;
ALTER TABLE public.teams ADD COLUMN bank_account_holder TEXT;
ALTER TABLE public.teams ADD COLUMN swift_code TEXT;
ALTER TABLE public.teams ADD COLUMN logo_url TEXT;

-- Create storage bucket for company assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-assets', 'company-assets', true);

-- Create storage policies for company assets
CREATE POLICY "Team owners can upload company assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'company-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Team members can view company assets"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'company-assets'
  AND EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.user_id = auth.uid()
    AND tm.team_id::text = (storage.foldername(name))[1]
  )
);

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
