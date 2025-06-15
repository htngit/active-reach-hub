
-- Fix RLS policies for qualification_criteria table with better contact access logic

-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view qualification criteria for accessible contacts" ON public.qualification_criteria;
DROP POLICY IF EXISTS "Users can insert qualification criteria for accessible contacts" ON public.qualification_criteria;
DROP POLICY IF EXISTS "Users can update qualification criteria for accessible contacts" ON public.qualification_criteria;
DROP POLICY IF EXISTS "Users can delete qualification criteria for accessible contacts" ON public.qualification_criteria;

-- Create simplified but comprehensive policies
CREATE POLICY "Enable all operations for authorized users"
  ON public.qualification_criteria
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.contacts c
      WHERE c.id = qualification_criteria.contact_id 
      AND (
        -- User owns the contact directly
        c.owner_id = auth.uid() 
        OR 
        -- User created the contact
        c.user_id = auth.uid()
        OR
        -- Contact is part of a team and user is team owner
        (c.team_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.teams t
          WHERE t.id = c.team_id AND t.owner_id = auth.uid()
        ))
        OR
        -- Contact is part of a team and user is team member
        (c.team_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.team_members tm
          WHERE tm.team_id = c.team_id AND tm.user_id = auth.uid()
        ))
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contacts c
      WHERE c.id = qualification_criteria.contact_id 
      AND (
        -- User owns the contact directly
        c.owner_id = auth.uid() 
        OR 
        -- User created the contact
        c.user_id = auth.uid()
        OR
        -- Contact is part of a team and user is team owner
        (c.team_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.teams t
          WHERE t.id = c.team_id AND t.owner_id = auth.uid()
        ))
        OR
        -- Contact is part of a team and user is team member
        (c.team_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.team_members tm
          WHERE tm.team_id = c.team_id AND tm.user_id = auth.uid()
        ))
      )
    )
  );
