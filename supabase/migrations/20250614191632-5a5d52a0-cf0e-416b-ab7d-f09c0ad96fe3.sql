
-- Fix team_invitations RLS policies to allow managers to create invitations
DROP POLICY IF EXISTS "Team managers can create invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "Team owners can create invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "Team members can view invitations" ON public.team_invitations;

-- Create new policies for team_invitations
-- Allow team owners and managers to create invitations
CREATE POLICY "Team owners and managers can create invitations"
  ON public.team_invitations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = team_invitations.team_id AND owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = team_invitations.team_id 
        AND user_id = auth.uid() 
        AND role = 'manager'
    )
  );

-- Allow team owners and managers to view invitations
CREATE POLICY "Team owners and managers can view invitations"
  ON public.team_invitations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = team_invitations.team_id AND owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = team_invitations.team_id 
        AND user_id = auth.uid() 
        AND role = 'manager'
    )
  );

-- Fix products RLS policies to allow team members to view products
DROP POLICY IF EXISTS "Team members can view products" ON public.products;

-- Create new policy that allows all team members (including regular members) to view products
CREATE POLICY "Team members can view products"
  ON public.products
  FOR SELECT
  USING (
    -- User is owner of the team
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = products.team_id AND owner_id = auth.uid()
    )
    OR
    -- User is a member of the team (any role)
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = products.team_id AND user_id = auth.uid()
    )
  );
