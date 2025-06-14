
-- Fix remaining foreign key constraints that might cause delete conflicts

-- First, let's handle activities table if it references contacts
ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_contact_id_fkey;
ALTER TABLE public.activities ADD CONSTRAINT activities_contact_id_fkey 
  FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;

-- Also ensure invoice_items cascade properly with invoices
ALTER TABLE public.invoice_items DROP CONSTRAINT IF EXISTS invoice_items_invoice_id_fkey;
ALTER TABLE public.invoice_items ADD CONSTRAINT invoice_items_invoice_id_fkey 
  FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;

-- And invoice_activities cascade properly with invoices  
ALTER TABLE public.invoice_activities DROP CONSTRAINT IF EXISTS invoice_activities_invoice_id_fkey;
ALTER TABLE public.invoice_activities ADD CONSTRAINT invoice_activities_invoice_id_fkey 
  FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;
