
-- Drop the existing trigger and function to recreate them properly
DROP TRIGGER IF EXISTS trigger_auto_qualify_lead ON public.qualification_criteria;
DROP FUNCTION IF EXISTS auto_qualify_lead();

-- Create improved function to auto-qualify leads based on BANT score
CREATE OR REPLACE FUNCTION auto_qualify_lead() 
RETURNS TRIGGER AS $$
BEGIN
  -- If qualification score is 75 or higher, automatically set contact status to Qualified
  IF NEW.qualification_score >= 75 THEN
    -- Update the contact status to Qualified
    UPDATE public.contacts 
    SET status = 'Qualified' 
    WHERE id = NEW.contact_id;
    
    -- Also update the qualification criteria contact_status
    NEW.contact_status := 'Qualified';
    NEW.qualified_at := now();
    NEW.qualified_by := auth.uid();
  ELSE
    -- If score drops below 75, we might want to update the status accordingly
    -- but we'll keep the contact_status as set by the user
    IF NEW.contact_status IS NULL THEN
      NEW.contact_status := (SELECT status FROM public.contacts WHERE id = NEW.contact_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires on both INSERT and UPDATE
CREATE TRIGGER trigger_auto_qualify_lead
  BEFORE INSERT OR UPDATE ON public.qualification_criteria
  FOR EACH ROW
  EXECUTE FUNCTION auto_qualify_lead();
