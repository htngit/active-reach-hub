export interface Product {
  id: string;
  name: string;
  description?: string;
  price?: number;
  stock?: number;
  status: string;
  category?: string;
  team_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}