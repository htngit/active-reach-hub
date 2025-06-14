
export interface Product {
  id: string;
  name: string;
  description?: string;
  price?: number | null;
  stock?: number;
  status: string;
  category?: string;
  team_id: string; // Now required (not nullable)
  created_by: string; // Now required (not nullable)
  created_at: string;
  updated_at: string;
}
