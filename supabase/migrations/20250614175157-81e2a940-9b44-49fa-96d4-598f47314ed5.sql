
-- Drop all existing policies on contacts table
DROP POLICY IF EXISTS "Users can view own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can insert own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Team owners can view team contacts" ON public.contacts;
DROP POLICY IF EXISTS "Team members can view team contacts" ON public.contacts;
DROP POLICY IF EXISTS "Team owners can update team contacts" ON public.contacts;
DROP POLICY IF EXISTS "Team owners can delete team contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can view their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Team members can view team contacts" ON public.contacts;
DROP POLICY IF EXISTS "Team owners can manage team contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can manage their own contacts" ON public.contacts;

-- Create comprehensive RLS policies for contacts
-- 1. Users can view their own contacts
CREATE POLICY "Users can view own contacts"
  ON public.contacts
  FOR SELECT
  USING (owner_id = auth.uid() OR user_id = auth.uid());

-- 2. Team owners can view all team contacts
CREATE POLICY "Team owners can view team contacts"
  ON public.contacts
  FOR SELECT
  USING (
    team_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = contacts.team_id AND owner_id = auth.uid()
    )
  );

-- 3. Team members can view all contacts in their teams
CREATE POLICY "Team members can view team contacts"
  ON public.contacts
  FOR SELECT
  USING (
    team_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = contacts.team_id AND user_id = auth.uid()
    )
  );

-- 4. Users can insert contacts
CREATE POLICY "Users can insert contacts"
  ON public.contacts
  FOR INSERT
  WITH CHECK (owner_id = auth.uid() AND user_id = auth.uid());

-- 5. Users can update their own contacts
CREATE POLICY "Users can update own contacts"
  ON public.contacts
  FOR UPDATE
  USING (owner_id = auth.uid() OR user_id = auth.uid());

-- 6. Team owners can update team contacts
CREATE POLICY "Team owners can update team contacts"
  ON public.contacts
  FOR UPDATE
  USING (
    team_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = contacts.team_id AND owner_id = auth.uid()
    )
  );

-- 7. Users can delete their own contacts
CREATE POLICY "Users can delete own contacts"
  ON public.contacts
  FOR DELETE
  USING (owner_id = auth.uid() OR user_id = auth.uid());

-- 8. Team owners can delete team contacts
CREATE POLICY "Team owners can delete team contacts"
  ON public.contacts
  FOR DELETE
  USING (
    team_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = contacts.team_id AND owner_id = auth.uid()
    )
  );
