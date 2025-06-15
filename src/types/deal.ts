
export interface Deal {
  id: string;
  title: string;
  description?: string;
  contact_id: string;
  stage: 'Lead' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
  value: number;
  probability: number;
  expected_close_date?: string;
  actual_close_date?: string;
  created_by: string;
  assigned_to?: string;
  team_id?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  notes?: string;
  source?: string;
}

export interface DealActivity {
  id: string;
  deal_id: string;
  activity_type: string;
  old_stage?: string;
  new_stage?: string;
  old_value?: number;
  new_value?: number;
  notes?: string;
  created_by: string;
  created_at: string;
}

export interface PipelineAnalytics {
  total_deals: number;
  total_value: number;
  won_deals: number;
  won_value: number;
  conversion_rate: number;
  stage_distribution: Record<string, number>;
  average_deal_size: number;
}
