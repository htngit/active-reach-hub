
-- Phase 1: Create engagements table with proper RBAC integration
CREATE TABLE public.engagements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'New', -- New, Active, Qualified, Proposal, Won, Lost
  potential_product TEXT[],
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_engagement_contact FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE
);

-- Enable RLS on engagements table
ALTER TABLE public.engagements ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can access engagements for contacts they can access
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
      )
    )
  );

-- Add engagement_id to qualification_criteria (nullable for migration)
ALTER TABLE public.qualification_criteria ADD COLUMN engagement_id UUID;
ALTER TABLE public.qualification_criteria ADD CONSTRAINT fk_qualification_engagement 
FOREIGN KEY (engagement_id) REFERENCES public.engagements(id) ON DELETE CASCADE;

-- Create engagement conversions table
CREATE TABLE public.engagement_conversions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  engagement_id UUID NOT NULL,
  invoice_id UUID NOT NULL,
  converted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  converted_by UUID NOT NULL,
  CONSTRAINT fk_conversion_engagement FOREIGN KEY (engagement_id) REFERENCES public.engagements(id) ON DELETE CASCADE,
  CONSTRAINT fk_conversion_invoice FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE,
  UNIQUE(engagement_id) -- One conversion per engagement
);

-- Enable RLS on engagement_conversions
ALTER TABLE public.engagement_conversions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can access conversions for engagements they can access
CREATE POLICY "Users can access conversions for accessible engagements"
  ON public.engagement_conversions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.engagements e
      JOIN public.contacts c ON c.id = e.contact_id
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
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.engagements e
      JOIN public.contacts c ON c.id = e.contact_id
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
      )
    )
  );

-- Update qualification_criteria RLS to handle both contact_id and engagement_id
DROP POLICY IF EXISTS "Enable all operations for authorized users" ON public.qualification_criteria;

CREATE POLICY "Users can access qualification criteria for accessible contacts and engagements"
  ON public.qualification_criteria
  FOR ALL
  USING (
    -- For engagement-based qualifications
    (engagement_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.engagements e
      JOIN public.contacts c ON c.id = e.contact_id
      WHERE e.id = qualification_criteria.engagement_id 
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
    ))
    OR
    -- For legacy contact-based qualifications (backward compatibility)
    (engagement_id IS NULL AND contact_id IS NOT NULL AND EXISTS (
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
    ))
  )
  WITH CHECK (
    -- For engagement-based qualifications
    (engagement_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.engagements e
      JOIN public.contacts c ON c.id = e.contact_id
      WHERE e.id = qualification_criteria.engagement_id 
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
    ))
    OR
    -- For legacy contact-based qualifications (backward compatibility)
    (engagement_id IS NULL AND contact_id IS NOT NULL AND EXISTS (
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
    ))
  );
