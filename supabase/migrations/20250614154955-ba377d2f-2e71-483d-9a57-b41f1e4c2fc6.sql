
-- Fix foreign key constraints to allow CASCADE DELETE for teams

-- Drop existing foreign key constraints and recreate with CASCADE
ALTER TABLE public.contacts DROP CONSTRAINT IF EXISTS contacts_team_id_fkey;
ALTER TABLE public.contacts ADD CONSTRAINT contacts_team_id_fkey 
  FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_team_id_fkey;
ALTER TABLE public.products ADD CONSTRAINT products_team_id_fkey 
  FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;

ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_team_id_fkey;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_team_id_fkey 
  FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;

-- Team members and invitations should also cascade
ALTER TABLE public.team_members DROP CONSTRAINT IF EXISTS team_members_team_id_fkey;
ALTER TABLE public.team_members ADD CONSTRAINT team_members_team_id_fkey 
  FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;

ALTER TABLE public.team_invitations DROP CONSTRAINT IF EXISTS team_invitations_team_id_fkey;
ALTER TABLE public.team_invitations ADD CONSTRAINT team_invitations_team_id_fkey 
  FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;
