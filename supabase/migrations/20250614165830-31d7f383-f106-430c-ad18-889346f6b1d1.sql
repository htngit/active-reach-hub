
-- First, let's check if contacts policies exist and create them if missing
DO $$
BEGIN
  -- Check if "Team members can view team contacts" policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contacts' 
    AND policyname = 'Team members can view team contacts'
  ) THEN
    EXECUTE 'CREATE POLICY "Team members can view team contacts" ON public.contacts
      FOR SELECT
      USING (
        team_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.team_members
          WHERE team_id = contacts.team_id AND user_id = auth.uid()
        )
      )';
  END IF;

  -- Check if "Users can view their own contacts" policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contacts' 
    AND policyname = 'Users can view their own contacts'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view their own contacts" ON public.contacts
      FOR SELECT
      USING (owner_id = auth.uid() OR user_id = auth.uid())';
  END IF;

  -- Check if "Team owners can manage team contacts" policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contacts' 
    AND policyname = 'Team owners can manage team contacts'
  ) THEN
    EXECUTE 'CREATE POLICY "Team owners can manage team contacts" ON public.contacts
      FOR ALL
      USING (
        team_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.teams
          WHERE id = contacts.team_id AND owner_id = auth.uid()
        )
      )';
  END IF;

  -- Check if "Users can manage their own contacts" policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contacts' 
    AND policyname = 'Users can manage their own contacts'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can manage their own contacts" ON public.contacts
      FOR ALL
      USING (owner_id = auth.uid())';
  END IF;
END $$;
