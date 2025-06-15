
-- Create a more permissive RLS policy for qualification_criteria to allow broader access
-- This is for testing purposes - you may want to restrict this later

DROP POLICY IF EXISTS "Enable all operations for authorized users" ON public.qualification_criteria;

-- Create a policy that allows any authenticated user to access qualification criteria
-- WARNING: This is very permissive and should be restricted based on your business logic
CREATE POLICY "Allow authenticated users full access"
  ON public.qualification_criteria
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
