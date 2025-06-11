-- Update the can_user_access_contact function to implement proper access control
CREATE OR REPLACE FUNCTION public.can_user_access_contact(contact_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_contact_owner_id UUID;
  v_contact_team_id UUID;
  v_contact_user_id UUID;
  v_is_team_owner BOOLEAN;
  v_user_role TEXT;
BEGIN
  -- Get contact details
  SELECT owner_id, team_id, user_id INTO v_contact_owner_id, v_contact_team_id, v_contact_user_id
  FROM public.contacts
  WHERE id = contact_id;
  
  -- If contact doesn't exist, return false
  IF v_contact_owner_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- If user is the direct owner of the contact, they can access it
  IF v_contact_owner_id = user_id THEN
    RETURN TRUE;
  END IF;
  
  -- If contact is not part of a team, and user is not the owner, they cannot access it
  IF v_contact_team_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user is the team owner
  SELECT owner_id = user_id INTO v_is_team_owner
  FROM public.teams
  WHERE id = v_contact_team_id;
  
  -- If user is the team owner, they can access all team contacts
  IF v_is_team_owner THEN
    RETURN TRUE;
  END IF;
  
  -- Check user's role in the team
  SELECT role INTO v_user_role
  FROM public.team_members
  WHERE team_id = v_contact_team_id AND user_id = user_id;
  
  -- If user is not a team member, they cannot access the contact
  IF v_user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- If user is a team member (not owner), they can only access their own contacts
  RETURN v_contact_user_id = user_id;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for contacts table
DROP POLICY IF EXISTS "Users can view their own contacts and team contacts" ON public.contacts;

-- Create new policy: Users can view their own contacts and team contacts based on role
CREATE POLICY "Users can view contacts based on ownership and role"
  ON public.contacts
  FOR SELECT
  USING (
    -- User is the direct owner of the contact
    owner_id = auth.uid()
    OR
    -- User is the creator of the contact
    user_id = auth.uid()
    OR
    -- User is the team owner (can see all team contacts)
    (team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = contacts.team_id AND owner_id = auth.uid()
    ))
    -- Team members can only see their own contacts
    -- (This is enforced by the above conditions - they can only see contacts where they are owner_id or user_id)
  );

-- Update the cached-contacts Edge Function to respect the new access control logic
-- Note: This is a comment only as Edge Functions cannot be updated via SQL migrations
-- You'll need to update the Edge Function code separately