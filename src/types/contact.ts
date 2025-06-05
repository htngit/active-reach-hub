
export interface Contact {
  id: string;
  name: string;
  phone_number: string;
  email?: string;
  company?: string;
  address?: string;
  notes?: string;
  labels?: string[];
  status: string;
  potential_product?: string[];
  created_at: string;
  owner_id?: string;
  team_id?: string;
  user_id: string; // Required to match database schema
}
