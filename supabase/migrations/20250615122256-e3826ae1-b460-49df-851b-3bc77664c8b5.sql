
-- Create enum for pipeline stages
CREATE TYPE public.pipeline_stage AS ENUM (
  'Lead',
  'Qualified', 
  'Proposal',
  'Negotiation',
  'Closed Won',
  'Closed Lost'
);

-- Create deals table for pipeline management
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  stage pipeline_stage NOT NULL DEFAULT 'Lead',
  value NUMERIC DEFAULT 0,
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  actual_close_date DATE,
  created_by UUID NOT NULL,
  assigned_to UUID,
  team_id UUID REFERENCES public.teams(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  source TEXT
);

-- Create deal activities table for tracking pipeline changes
CREATE TABLE public.deal_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  old_stage pipeline_stage,
  new_stage pipeline_stage,
  old_value NUMERIC,
  new_value NUMERIC,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on deals table
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Create policy for deals - users can manage deals they created or are assigned to, and team members can view team deals
CREATE POLICY "Users can manage their own deals and view team deals"
  ON public.deals
  FOR ALL
  USING (
    created_by = auth.uid() 
    OR assigned_to = auth.uid()
    OR (team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = deals.team_id AND tm.user_id = auth.uid()
    ))
    OR (team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = deals.team_id AND t.owner_id = auth.uid()
    ))
  )
  WITH CHECK (
    created_by = auth.uid()
    OR (team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = deals.team_id AND tm.user_id = auth.uid()
    ))
    OR (team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = deals.team_id AND t.owner_id = auth.uid()
    ))
  );

-- Enable RLS on deal activities table
ALTER TABLE public.deal_activities ENABLE ROW LEVEL SECURITY;

-- Create policy for deal activities - users can view activities for deals they have access to
CREATE POLICY "Users can view deal activities for accessible deals"
  ON public.deal_activities
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = deal_activities.deal_id
      AND (
        d.created_by = auth.uid() 
        OR d.assigned_to = auth.uid()
        OR (d.team_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.team_members tm
          WHERE tm.team_id = d.team_id AND tm.user_id = auth.uid()
        ))
        OR (d.team_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.teams t
          WHERE t.id = d.team_id AND t.owner_id = auth.uid()
        ))
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = deal_activities.deal_id
      AND (
        d.created_by = auth.uid()
        OR (d.team_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.team_members tm
          WHERE tm.team_id = d.team_id AND tm.user_id = auth.uid()
        ))
        OR (d.team_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.teams t
          WHERE t.id = d.team_id AND t.owner_id = auth.uid()
        ))
      )
    )
  );

-- Create function to update deal timestamps and log activities
CREATE OR REPLACE FUNCTION public.update_deal_stage()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the updated_at timestamp
  NEW.updated_at = now();
  
  -- If stage changed to closed, set closed_at and actual_close_date
  IF NEW.stage IN ('Closed Won', 'Closed Lost') AND OLD.stage NOT IN ('Closed Won', 'Closed Lost') THEN
    NEW.closed_at = now();
    IF NEW.actual_close_date IS NULL THEN
      NEW.actual_close_date = CURRENT_DATE;
    END IF;
  END IF;
  
  -- If stage changed, log the activity
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO public.deal_activities (
      deal_id, 
      activity_type, 
      old_stage, 
      new_stage, 
      created_by
    ) VALUES (
      NEW.id,
      'stage_change',
      OLD.stage,
      NEW.stage,
      auth.uid()
    );
  END IF;
  
  -- If value changed, log the activity
  IF OLD.value IS DISTINCT FROM NEW.value THEN
    INSERT INTO public.deal_activities (
      deal_id, 
      activity_type, 
      old_value, 
      new_value, 
      created_by
    ) VALUES (
      NEW.id,
      'value_change',
      OLD.value,
      NEW.value,
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for deal updates
CREATE TRIGGER update_deal_stage_trigger
  BEFORE UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_deal_stage();

-- Create function to calculate pipeline conversion rates
CREATE OR REPLACE FUNCTION public.get_pipeline_analytics()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_deals', (SELECT COUNT(*) FROM public.deals),
    'total_value', (SELECT COALESCE(SUM(value), 0) FROM public.deals),
    'won_deals', (SELECT COUNT(*) FROM public.deals WHERE stage = 'Closed Won'),
    'won_value', (SELECT COALESCE(SUM(value), 0) FROM public.deals WHERE stage = 'Closed Won'),
    'conversion_rate', (
      CASE 
        WHEN (SELECT COUNT(*) FROM public.deals WHERE stage IN ('Closed Won', 'Closed Lost')) > 0
        THEN ROUND(
          (SELECT COUNT(*)::NUMERIC FROM public.deals WHERE stage = 'Closed Won') * 100.0 /
          (SELECT COUNT(*)::NUMERIC FROM public.deals WHERE stage IN ('Closed Won', 'Closed Lost')), 2
        )
        ELSE 0
      END
    ),
    'stage_distribution', (
      SELECT json_object_agg(stage, stage_count)
      FROM (
        SELECT stage, COUNT(*) as stage_count
        FROM public.deals
        GROUP BY stage
      ) stage_stats
    ),
    'average_deal_size', (
      SELECT COALESCE(ROUND(AVG(value), 2), 0)
      FROM public.deals
      WHERE stage = 'Closed Won'
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
