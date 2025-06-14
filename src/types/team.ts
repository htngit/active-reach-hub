
export interface Team {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  // Company Information
  company_legal_name?: string;
  tax_id?: string;
  company_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  company_phone?: string;
  company_email?: string;
  website?: string;
  bank_name?: string;
  bank_account?: string;
  bank_account_holder?: string;
  swift_code?: string;
  logo_url?: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  token: string;
  expires_at: string;
  used_at?: string;
  created_at: string;
}

export interface AcceptInvitationResponse {
  success: boolean;
  message: string;
  team_name?: string;
  team_id?: string;
}
