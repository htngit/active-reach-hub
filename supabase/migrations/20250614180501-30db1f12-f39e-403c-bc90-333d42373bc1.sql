
-- Drop existing policies and recreate them with proper logic
DROP POLICY IF EXISTS "Users can view own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Team owners can view team contacts" ON public.contacts;
DROP POLICY IF EXISTS "Team members can view team contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can insert contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Team owners can update team contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Team owners can delete team contacts" ON public.contacts;

-- 1. Users can view their own contacts (contacts they created)
CREATE POLICY "Users can view own contacts"
  ON public.contacts
  FOR SELECT
  USING (owner_id = auth.uid() OR user_id = auth.uid());

-- 2. Team owners can view ALL contacts from their team members
CREATE POLICY "Team owners can view team member contacts"
  ON public.contacts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.owner_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = t.id 
        AND tm.user_id = contacts.user_id
      )
    )
  );

-- 3. Team members can view contacts in their shared teams (optional - you may want to disable this)
CREATE POLICY "Team members can view shared team contacts"
  ON public.contacts
  FOR SELECT
  USING (
    team_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = contacts.team_id AND user_id = auth.uid()
    )
  );

-- 4. Users can insert their own contacts
CREATE POLICY "Users can insert contacts"
  ON public.contacts
  FOR INSERT
  WITH CHECK (owner_id = auth.uid() AND user_id = auth.uid());

-- 5. Users can update their own contacts
CREATE POLICY "Users can update own contacts"
  ON public.contacts
  FOR UPDATE
  USING (owner_id = auth.uid() AND user_id = auth.uid());

-- 6. Team owners can update contacts from their team members
CREATE POLICY "Team owners can update team member contacts"
  ON public.contacts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.owner_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = t.id 
        AND tm.user_id = contacts.user_id
      )
    )
  );

-- 7. Users can delete their own contacts
CREATE POLICY "Users can delete own contacts"
  ON public.contacts
  FOR DELETE
  USING (owner_id = auth.uid() AND user_id = auth.uid());

-- 8. Team owners can delete contacts from their team members
CREATE POLICY "Team owners can delete team member contacts"
  ON public.contacts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.owner_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = t.id 
        AND tm.user_id = contacts.user_id
      )
    )
  );
