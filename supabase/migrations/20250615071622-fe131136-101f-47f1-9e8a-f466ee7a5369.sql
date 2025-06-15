
-- Fix the engagements RLS policy to properly handle team access
DROP POLICY IF EXISTS "Users can access engagements for accessible contacts" ON public.engagements;

CREATE POLICY "Users can access engagements for accessible contacts"
  ON public.engagements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.contacts c
      WHERE c.id = engagements.contact_id 
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
        OR
        -- NEW: User is a team owner and can access any contact (even those without team_id)
        EXISTS (
          SELECT 1 FROM public.teams t
          WHERE t.owner_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contacts c
      WHERE c.id = engagements.contact_id 
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
        OR
        -- NEW: User is a team owner and can access any contact (even those without team_id)
        EXISTS (
          SELECT 1 FROM public.teams t
          WHERE t.owner_id = auth.uid()
        )
      )
    )
  );
