
-- Enable RLS on invoice tables
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_activities ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for invoices table
CREATE POLICY "Team members can view invoices"
  ON public.invoices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = invoices.team_id AND user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = invoices.team_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Team members can insert invoices"
  ON public.invoices
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = invoices.team_id AND user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Team members can update invoices"
  ON public.invoices
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = invoices.team_id AND user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = invoices.team_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Team members can delete invoices"
  ON public.invoices
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = invoices.team_id AND owner_id = auth.uid()
    )
  );

-- Add RLS policies for invoice_items table
CREATE POLICY "Team members can view invoice items"
  ON public.invoice_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      JOIN public.team_members tm ON i.team_id = tm.team_id
      WHERE i.id = invoice_items.invoice_id AND tm.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.invoices i
      JOIN public.teams t ON i.team_id = t.id
      WHERE i.id = invoice_items.invoice_id AND t.owner_id = auth.uid()
    )
  );

CREATE POLICY "Team members can manage invoice items"
  ON public.invoice_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      JOIN public.team_members tm ON i.team_id = tm.team_id
      WHERE i.id = invoice_items.invoice_id AND tm.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.invoices i
      JOIN public.teams t ON i.team_id = t.id
      WHERE i.id = invoice_items.invoice_id AND t.owner_id = auth.uid()
    )
  );

-- Add RLS policies for invoice_activities table
CREATE POLICY "Team members can view invoice activities"
  ON public.invoice_activities
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      JOIN public.team_members tm ON i.team_id = tm.team_id
      WHERE i.id = invoice_activities.invoice_id AND tm.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.invoices i
      JOIN public.teams t ON i.team_id = t.id
      WHERE i.id = invoice_activities.invoice_id AND t.owner_id = auth.uid()
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
