
-- Add system_settings table for global configurations
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for system_settings
CREATE POLICY "Users can view their own system settings"
  ON public.system_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own system settings"
  ON public.system_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own system settings"
  ON public.system_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Update team_members table to support manager role
-- First, let's see what the current constraint allows
ALTER TABLE public.team_members DROP CONSTRAINT IF EXISTS team_members_role_check;

-- Add new constraint that supports owner, manager, and member roles
ALTER TABLE public.team_members ADD CONSTRAINT team_members_role_check 
  CHECK (role IN ('owner', 'manager', 'member'));

-- Create function to check if user is team manager
CREATE OR REPLACE FUNCTION public.is_team_manager(team_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = team_uuid AND user_id = user_uuid AND role = 'manager'
  );
$$;

-- Create function to get user's subordinates (for managers)
CREATE OR REPLACE FUNCTION public.get_subordinate_user_ids(team_uuid uuid, manager_uuid uuid)
RETURNS TABLE(user_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT tm.user_id
  FROM public.team_members tm
  WHERE tm.team_id = team_uuid 
    AND tm.role = 'member'
    AND EXISTS (
      SELECT 1 FROM public.team_members manager_tm
      WHERE manager_tm.team_id = team_uuid 
        AND manager_tm.user_id = manager_uuid 
        AND manager_tm.role = 'manager'
    );
$$;

-- Enhanced RLS policies for contacts with manager role support
DROP POLICY IF EXISTS "Team owners can view team member contacts" ON public.contacts;
DROP POLICY IF EXISTS "Team members can view shared team contacts" ON public.contacts;

-- Owner can view all team contacts
CREATE POLICY "Team owners can view all team contacts"
  ON public.contacts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.owner_id = auth.uid()
      AND (
        contacts.team_id = t.id
        OR EXISTS (
          SELECT 1 FROM public.team_members tm
          WHERE tm.team_id = t.id 
          AND tm.user_id = contacts.user_id
        )
      )
    )
  );

-- Manager can view their own contacts and subordinate contacts
CREATE POLICY "Team managers can view subordinate contacts"
  ON public.contacts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.user_id = auth.uid() 
        AND tm.role = 'manager'
        AND (
          contacts.user_id = auth.uid()
          OR contacts.user_id IN (
            SELECT subordinate_id FROM public.get_subordinate_user_ids(tm.team_id, auth.uid()) AS subordinate_id
          )
        )
    )
  );

-- Similar enhanced policies for products
DROP POLICY IF EXISTS "Team members can view products" ON public.products;

CREATE POLICY "Team owners can view all team products"
  ON public.products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.owner_id = auth.uid() AND t.id = products.team_id
    )
  );

CREATE POLICY "Team managers can view subordinate products"
  ON public.products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.user_id = auth.uid() 
        AND tm.role = 'manager'
        AND tm.team_id = products.team_id
        AND (
          products.created_by = auth.uid()
          OR products.created_by IN (
            SELECT subordinate_id FROM public.get_subordinate_user_ids(tm.team_id, auth.uid()) AS subordinate_id
          )
        )
    )
  );

CREATE POLICY "Team members can view own products"
  ON public.products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.user_id = auth.uid() 
        AND tm.role = 'member'
        AND tm.team_id = products.team_id
        AND products.created_by = auth.uid()
    )
  );
