
-- Fix RLS policies for qualification_criteria table to allow proper access

-- First, drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can view own qualification criteria" ON public.qualification_criteria;
DROP POLICY IF EXISTS "Team owners can view team qualification criteria" ON public.qualification_criteria;
DROP POLICY IF EXISTS "Users can insert qualification criteria" ON public.qualification_criteria;
DROP POLICY IF EXISTS "Users can update own qualification criteria" ON public.qualification_criteria;
DROP POLICY IF EXISTS "Team owners can update team qualification criteria" ON public.qualification_criteria;

-- Create new comprehensive policies that properly handle team access
CREATE POLICY "Users can view qualification criteria for accessible contacts"
  ON public.qualification_criteria
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contacts 
      WHERE id = qualification_criteria.contact_id 
      AND (
        -- User owns the contact
        owner_id = auth.uid() 
        OR 
        -- User created the contact
        user_id = auth.uid()
        OR
        -- User is team owner of contact's team
        (team_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.teams 
          WHERE id = contacts.team_id AND owner_id = auth.uid()
        ))
        OR
        -- User is team member of contact's team
        (team_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.team_members 
          WHERE team_id = contacts.team_id AND user_id = auth.uid()
        ))
      )
    )
  );

CREATE POLICY "Users can insert qualification criteria for accessible contacts"
  ON public.qualification_criteria
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contacts 
      WHERE id = qualification_criteria.contact_id 
      AND (
        -- User owns the contact
        owner_id = auth.uid() 
        OR 
        -- User created the contact
        user_id = auth.uid()
        OR
        -- User is team owner of contact's team
        (team_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.teams 
          WHERE id = contacts.team_id AND owner_id = auth.uid()
        ))
        OR
        -- User is team member of contact's team
        (team_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.team_members 
          WHERE team_id = contacts.team_id AND user_id = auth.uid()
        ))
      )
    )
  );

CREATE POLICY "Users can update qualification criteria for accessible contacts"
  ON public.qualification_criteria
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.contacts 
      WHERE id = qualification_criteria.contact_id 
      AND (
        -- User owns the contact
        owner_id = auth.uid() 
        OR 
        -- User created the contact
        user_id = auth.uid()
        OR
        -- User is team owner of contact's team
        (team_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.teams 
          WHERE id = contacts.team_id AND owner_id = auth.uid()
        ))
        OR
        -- User is team member of contact's team
        (team_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.team_members 
          WHERE team_id = contacts.team_id AND user_id = auth.uid()
        ))
      )
    )
  );

CREATE POLICY "Users can delete qualification criteria for accessible contacts"
  ON public.qualification_criteria
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.contacts 
      WHERE id = qualification_criteria.contact_id 
      AND (
        -- User owns the contact
        owner_id = auth.uid() 
        OR 
        -- User created the contact
        user_id = auth.uid()
        OR
        -- User is team owner of contact's team
        (team_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.teams 
          WHERE id = contacts.team_id AND owner_id = auth.uid()
        ))
        OR
        -- User is team member of contact's team
        (team_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.team_members 
          WHERE team_id = contacts.team_id AND user_id = auth.uid()
        ))
      )
    )
  );
