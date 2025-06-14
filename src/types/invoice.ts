
export interface Invoice {
  id: string;
  invoice_number: string;
  contact_id: string;
  team_id: string;
  created_by: string;
  status: string;
  subtotal: number;
  tax_rate?: number;
  tax_amount?: number;
  total: number;
  due_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface InvoiceActivity {
  id: string;
  invoice_id: string;
  user_id: string;
  activity_type: string;
  details?: string;
  created_at: string;
}

export interface CreateInvoiceRequest {
  contact_id: string;
  team_id: string;
  items: Omit<InvoiceItem, 'id' | 'invoice_id' | 'created_at'>[];
  tax_rate?: number;
  due_date?: string;
  notes?: string;
}
