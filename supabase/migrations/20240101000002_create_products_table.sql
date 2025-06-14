-- Create products table in public schema
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  stock INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Draft',
  category TEXT,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is team owner
CREATE OR REPLACE FUNCTION public.can_user_manage_product(product_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_team_id UUID;
  v_is_team_owner BOOLEAN;
BEGIN
  -- Get product's team_id
  SELECT team_id INTO v_team_id
  FROM public.products
  WHERE id = product_id;
  
  -- If product doesn't exist, return false
  IF v_team_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user is the team owner
  SELECT (owner_id = user_id) INTO v_is_team_owner
  FROM public.teams
  WHERE id = v_team_id;
  
  -- Return true if user is team owner
  RETURN COALESCE(v_is_team_owner, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policies for products table
-- Users can view products if they are a member of the team
CREATE POLICY "Team members can view products"
  ON public.products
  FOR SELECT
  USING (
    -- User is a member of the team that owns the product
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
    -- User is the owner of the team
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = products.team_id AND owner_id = auth.uid()
    )
  );

-- Only team owners can update products
CREATE POLICY "Team owners can update products"
  ON public.products
  FOR UPDATE
  USING (
    -- User is the owner of the team
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = products.team_id AND owner_id = auth.uid()
    )
  );

-- Only team owners can delete products
CREATE POLICY "Team owners can delete products"
  ON public.products
  FOR DELETE
  USING (
    -- User is the owner of the team
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = products.team_id AND owner_id = auth.uid()
    )
  );