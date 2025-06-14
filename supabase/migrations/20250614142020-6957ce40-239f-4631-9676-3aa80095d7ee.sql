
-- First, let's make sure team_id and created_by are not nullable since they're required for RLS
ALTER TABLE public.products 
ALTER COLUMN team_id SET NOT NULL,
ALTER COLUMN created_by SET NOT NULL;

-- Drop existing policies
DROP POLICY IF EXISTS "Team members can view products" ON public.products;
DROP POLICY IF EXISTS "Team owners can insert products" ON public.products;
DROP POLICY IF EXISTS "Team owners can update products" ON public.products;
DROP POLICY IF EXISTS "Team owners can delete products" ON public.products;

-- Create new, more explicit policies
-- Users can view products if they are a member of the team that owns the product
CREATE POLICY "Team members can view products"
  ON public.products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = products.team_id AND user_id = auth.uid()
    )
  );

-- Only team owners can insert products
CREATE POLICY "Team owners can insert products"
  ON public.products
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = products.team_id AND owner_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Only team owners can update their products
CREATE POLICY "Team owners can update products"
  ON public.products
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = products.team_id AND owner_id = auth.uid()
    )
  );

-- Only team owners can delete their products
CREATE POLICY "Team owners can delete products"
  ON public.products
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = products.team_id AND owner_id = auth.uid()
    )
  );
