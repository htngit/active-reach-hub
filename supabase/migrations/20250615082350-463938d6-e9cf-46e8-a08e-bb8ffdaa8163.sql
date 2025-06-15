
-- Check if RLS is enabled and add policies for engagement_conversions table
ALTER TABLE public.engagement_conversions ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view conversions for engagements they can access
CREATE POLICY "Users can view accessible engagement conversions"
  ON public.engagement_conversions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.engagements e
      JOIN public.contacts c ON e.contact_id = c.id
      WHERE e.id = engagement_conversions.engagement_id 
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
        -- User is a team owner and can access any contact
        EXISTS (
          SELECT 1 FROM public.teams t
          WHERE t.owner_id = auth.uid()
        )
      )
    )
  );

-- Policy to allow users to create conversions for engagements they can access
CREATE POLICY "Users can create conversions for accessible engagements"
  ON public.engagement_conversions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.engagements e
      JOIN public.contacts c ON e.contact_id = c.id
      WHERE e.id = engagement_conversions.engagement_id 
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
        -- User is a team owner and can access any contact
        EXISTS (
          SELECT 1 FROM public.teams t
          WHERE t.owner_id = auth.uid()
        )
      )
    )
  );

-- Policy to allow users to update conversions for engagements they can access
CREATE POLICY "Users can update conversions for accessible engagements"
  ON public.engagement_conversions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.engagements e
      JOIN public.contacts c ON e.contact_id = c.id
      WHERE e.id = engagement_conversions.engagement_id 
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
        -- User is a team owner and can access any contact
        EXISTS (
          SELECT 1 FROM public.teams t
          WHERE t.owner_id = auth.uid()
        )
      )
    )
  );

-- Policy to allow users to delete conversions for engagements they can access
CREATE POLICY "Users can delete conversions for accessible engagements"
  ON public.engagement_conversions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.engagements e
      JOIN public.contacts c ON e.contact_id = c.id
      WHERE e.id = engagement_conversions.engagement_id 
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
        -- User is a team owner and can access any contact
        EXISTS (
          SELECT 1 FROM public.teams t
          WHERE t.owner_id = auth.uid()
        )
      )
    )
  );
