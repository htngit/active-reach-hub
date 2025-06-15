
-- Add 'Qualified' status to contacts if not already present
-- Update the default status options to include Qualified

-- Create qualification_criteria table to track lead qualification details
CREATE TABLE public.qualification_criteria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL,
  budget_confirmed BOOLEAN DEFAULT FALSE,
  authority_confirmed BOOLEAN DEFAULT FALSE,
  need_identified BOOLEAN DEFAULT FALSE,
  timeline_defined BOOLEAN DEFAULT FALSE,
  qualification_score INTEGER DEFAULT 0,
  qualification_method TEXT, -- 'manual', 'automatic', 'activity_based'
  qualification_notes TEXT,
  qualified_at TIMESTAMP WITH TIME ZONE,
  qualified_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraint
ALTER TABLE public.qualification_criteria 
ADD CONSTRAINT fk_qualification_contact 
FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;

-- Enable RLS on qualification_criteria table
ALTER TABLE public.qualification_criteria ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for qualification_criteria
CREATE POLICY "Users can view own qualification criteria"
  ON public.qualification_criteria
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contacts 
      WHERE id = qualification_criteria.contact_id 
      AND (owner_id = auth.uid() OR user_id = auth.uid())
    )
  );

CREATE POLICY "Team owners can view team qualification criteria"
  ON public.qualification_criteria
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contacts c
      JOIN public.teams t ON c.team_id = t.id
      WHERE c.id = qualification_criteria.contact_id 
      AND t.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert qualification criteria"
  ON public.qualification_criteria
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contacts 
      WHERE id = qualification_criteria.contact_id 
      AND (owner_id = auth.uid() OR user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update own qualification criteria"
  ON public.qualification_criteria
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.contacts 
      WHERE id = qualification_criteria.contact_id 
      AND (owner_id = auth.uid() OR user_id = auth.uid())
    )
  );

CREATE POLICY "Team owners can update team qualification criteria"
  ON public.qualification_criteria
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.contacts c
      JOIN public.teams t ON c.team_id = t.id
      WHERE c.id = qualification_criteria.contact_id 
      AND t.owner_id = auth.uid()
    )
  );

-- Create function to automatically calculate qualification score
CREATE OR REPLACE FUNCTION calculate_qualification_score(
  budget_confirmed BOOLEAN,
  authority_confirmed BOOLEAN,
  need_identified BOOLEAN,
  timeline_defined BOOLEAN
) RETURNS INTEGER AS $$
BEGIN
  RETURN (
    CASE WHEN budget_confirmed THEN 25 ELSE 0 END +
    CASE WHEN authority_confirmed THEN 25 ELSE 0 END +
    CASE WHEN need_identified THEN 25 ELSE 0 END +
    CASE WHEN timeline_defined THEN 25 ELSE 0 END
  );
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update qualification score
CREATE OR REPLACE FUNCTION update_qualification_score() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.qualification_score := calculate_qualification_score(
    NEW.budget_confirmed,
    NEW.authority_confirmed,
    NEW.need_identified,
    NEW.timeline_defined
  );
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_qualification_score
  BEFORE INSERT OR UPDATE ON public.qualification_criteria
  FOR EACH ROW
  EXECUTE FUNCTION update_qualification_score();

-- Create function to auto-qualify leads based on score
CREATE OR REPLACE FUNCTION auto_qualify_lead() 
RETURNS TRIGGER AS $$
BEGIN
  -- If qualification score is 75 or higher, automatically set contact status to Qualified
  IF NEW.qualification_score >= 75 AND OLD.qualification_score < 75 THEN
    UPDATE public.contacts 
    SET status = 'Qualified' 
    WHERE id = NEW.contact_id AND status != 'Qualified';
    
    NEW.qualified_at := now();
    NEW.qualified_by := auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_qualify_lead
  AFTER UPDATE ON public.qualification_criteria
  FOR EACH ROW
  EXECUTE FUNCTION auto_qualify_lead();
