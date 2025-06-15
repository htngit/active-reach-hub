
-- Add contact_status column to qualification_criteria table
ALTER TABLE public.qualification_criteria 
ADD COLUMN contact_status TEXT;
