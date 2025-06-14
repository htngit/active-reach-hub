
-- Create invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'Draft',
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create invoice_items table
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create invoice_activities table for tracking invoice events
CREATE TABLE public.invoice_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  activity_type TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all invoice tables
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_activities ENABLE ROW LEVEL SECURITY;

-- RLS policies for invoices table
CREATE POLICY "Team members can view invoices"
  ON public.invoices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = invoices.team_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can insert invoices"
  ON public.invoices
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = invoices.team_id AND owner_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Team owners can update invoices"
  ON public.invoices
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = invoices.team_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can delete invoices"
  ON public.invoices
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = invoices.team_id AND owner_id = auth.uid()
    )
  );

-- RLS policies for invoice_items table
CREATE POLICY "Team members can view invoice items"
  ON public.invoice_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      JOIN public.team_members tm ON i.team_id = tm.team_id
      WHERE i.id = invoice_items.invoice_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can manage invoice items"
  ON public.invoice_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      JOIN public.teams t ON i.team_id = t.id
      WHERE i.id = invoice_items.invoice_id AND t.owner_id = auth.uid()
    )
  );

-- RLS policies for invoice_activities table
CREATE POLICY "Team members can view invoice activities"
  ON public.invoice_activities
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      JOIN public.team_members tm ON i.team_id = tm.team_id
      WHERE i.id = invoice_activities.invoice_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can create invoice activities"
  ON public.invoice_activities
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices i
      JOIN public.team_members tm ON i.team_id = tm.team_id
      WHERE i.id = invoice_activities.invoice_id AND tm.user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Create function to generate invoice numbers
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  invoice_number TEXT;
BEGIN
  -- Get the next invoice number by counting existing invoices + 1
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '\d+') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.invoices
  WHERE invoice_number ~ '^INV-\d+$';
  
  -- Format as INV-0001, INV-0002, etc.
  invoice_number := 'INV-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Add new activity types for contact engagement tracking
-- This extends the existing activities table to support invoice-related activities
