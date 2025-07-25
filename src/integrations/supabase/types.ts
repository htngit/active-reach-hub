export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          api_call_status: string | null
          contact_id: string
          created_at: string | null
          details: string | null
          id: string
          timestamp: string | null
          type: string
          user_id: string
        }
        Insert: {
          api_call_status?: string | null
          contact_id: string
          created_at?: string | null
          details?: string | null
          id?: string
          timestamp?: string | null
          type: string
          user_id: string
        }
        Update: {
          api_call_status?: string | null
          contact_id?: string
          created_at?: string | null
          details?: string | null
          id?: string
          timestamp?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address: string | null
          company: string | null
          created_at: string | null
          email: string | null
          id: string
          labels: string[] | null
          name: string
          notes: string | null
          owner_id: string
          phone_number: string
          potential_product: string[] | null
          status: string
          team_id: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          labels?: string[] | null
          name: string
          notes?: string | null
          owner_id: string
          phone_number: string
          potential_product?: string[] | null
          status?: string
          team_id?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          labels?: string[] | null
          name?: string
          notes?: string | null
          owner_id?: string
          phone_number?: string
          potential_product?: string[] | null
          status?: string
          team_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_activities: {
        Row: {
          activity_type: string
          created_at: string
          created_by: string
          deal_id: string
          id: string
          new_stage: Database["public"]["Enums"]["pipeline_stage"] | null
          new_value: number | null
          notes: string | null
          old_stage: Database["public"]["Enums"]["pipeline_stage"] | null
          old_value: number | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          created_by: string
          deal_id: string
          id?: string
          new_stage?: Database["public"]["Enums"]["pipeline_stage"] | null
          new_value?: number | null
          notes?: string | null
          old_stage?: Database["public"]["Enums"]["pipeline_stage"] | null
          old_value?: number | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          created_by?: string
          deal_id?: string
          id?: string
          new_stage?: Database["public"]["Enums"]["pipeline_stage"] | null
          new_value?: number | null
          notes?: string | null
          old_stage?: Database["public"]["Enums"]["pipeline_stage"] | null
          old_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          actual_close_date: string | null
          assigned_to: string | null
          closed_at: string | null
          contact_id: string
          created_at: string
          created_by: string
          description: string | null
          expected_close_date: string | null
          id: string
          notes: string | null
          probability: number | null
          source: string | null
          stage: Database["public"]["Enums"]["pipeline_stage"]
          team_id: string | null
          title: string
          updated_at: string
          value: number | null
        }
        Insert: {
          actual_close_date?: string | null
          assigned_to?: string | null
          closed_at?: string | null
          contact_id: string
          created_at?: string
          created_by: string
          description?: string | null
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          probability?: number | null
          source?: string | null
          stage?: Database["public"]["Enums"]["pipeline_stage"]
          team_id?: string | null
          title: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          actual_close_date?: string | null
          assigned_to?: string | null
          closed_at?: string | null
          contact_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          probability?: number | null
          source?: string | null
          stage?: Database["public"]["Enums"]["pipeline_stage"]
          team_id?: string | null
          title?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_conversions: {
        Row: {
          converted_at: string
          converted_by: string
          engagement_id: string
          id: string
          invoice_id: string
        }
        Insert: {
          converted_at?: string
          converted_by: string
          engagement_id: string
          id?: string
          invoice_id: string
        }
        Update: {
          converted_at?: string
          converted_by?: string
          engagement_id?: string
          id?: string
          invoice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_conversion_engagement"
            columns: ["engagement_id"]
            isOneToOne: true
            referencedRelation: "engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_conversion_invoice"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      engagements: {
        Row: {
          contact_id: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          potential_product: string[] | null
          status: string
          updated_at: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          potential_product?: string[] | null
          status?: string
          updated_at?: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          potential_product?: string[] | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_engagement_contact"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_activities: {
        Row: {
          activity_type: string
          created_at: string | null
          details: string | null
          id: string
          invoice_id: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          details?: string | null
          id?: string
          invoice_id: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          details?: string | null
          id?: string
          invoice_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_activities_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          invoice_id: string
          product_id: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          invoice_id: string
          product_id?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string
          product_id?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          contact_id: string
          created_at: string | null
          created_by: string
          due_date: string | null
          id: string
          invoice_number: string
          notes: string | null
          status: string
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          team_id: string
          total: number
          updated_at: string | null
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          created_by: string
          due_date?: string | null
          id?: string
          invoice_number: string
          notes?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          team_id: string
          total?: number
          updated_at?: string | null
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          created_by?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          notes?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          team_id?: string
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      labels: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      message_template_sets: {
        Row: {
          associated_label_id: string
          created_at: string
          id: string
          template_variation_1: string
          template_variation_2: string
          template_variation_3: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          associated_label_id: string
          created_at?: string
          id?: string
          template_variation_1: string
          template_variation_2: string
          template_variation_3: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          associated_label_id?: string
          created_at?: string
          id?: string
          template_variation_1?: string
          template_variation_2?: string
          template_variation_3?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_message_template_sets_label"
            columns: ["associated_label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          name: string
          price: number | null
          status: string
          stock: number
          team_id: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          name: string
          price?: number | null
          status?: string
          stock?: number
          team_id: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          price?: number | null
          status?: string
          stock?: number
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      qualification_criteria: {
        Row: {
          authority_confirmed: boolean | null
          budget_confirmed: boolean | null
          contact_id: string
          contact_status: string | null
          created_at: string
          engagement_id: string | null
          id: string
          need_identified: boolean | null
          qualification_method: string | null
          qualification_notes: string | null
          qualification_score: number | null
          qualified_at: string | null
          qualified_by: string | null
          timeline_defined: boolean | null
          updated_at: string
        }
        Insert: {
          authority_confirmed?: boolean | null
          budget_confirmed?: boolean | null
          contact_id: string
          contact_status?: string | null
          created_at?: string
          engagement_id?: string | null
          id?: string
          need_identified?: boolean | null
          qualification_method?: string | null
          qualification_notes?: string | null
          qualification_score?: number | null
          qualified_at?: string | null
          qualified_by?: string | null
          timeline_defined?: boolean | null
          updated_at?: string
        }
        Update: {
          authority_confirmed?: boolean | null
          budget_confirmed?: boolean | null
          contact_id?: string
          contact_status?: string | null
          created_at?: string
          engagement_id?: string | null
          id?: string
          need_identified?: boolean | null
          qualification_method?: string | null
          qualification_notes?: string | null
          qualification_score?: number | null
          qualified_at?: string | null
          qualified_by?: string | null
          timeline_defined?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_qualification_contact"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qualification_engagement"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          currency: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          team_id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          team_id: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          team_id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          bank_account: string | null
          bank_account_holder: string | null
          bank_name: string | null
          city: string | null
          company_address: string | null
          company_email: string | null
          company_legal_name: string | null
          company_phone: string | null
          country: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          postal_code: string | null
          state: string | null
          swift_code: string | null
          tax_id: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          bank_account?: string | null
          bank_account_holder?: string | null
          bank_name?: string | null
          city?: string | null
          company_address?: string | null
          company_email?: string | null
          company_legal_name?: string | null
          company_phone?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          postal_code?: string | null
          state?: string | null
          swift_code?: string | null
          tax_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          bank_account?: string | null
          bank_account_holder?: string | null
          bank_name?: string | null
          city?: string | null
          company_address?: string | null
          company_email?: string | null
          company_legal_name?: string | null
          company_phone?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          postal_code?: string | null
          state?: string | null
          swift_code?: string | null
          tax_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      template_cache: {
        Row: {
          cache_data: Json
          cache_key: string
          created_at: string
          expires_at: string
          id: string
          metadata_version: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cache_data: Json
          cache_key: string
          created_at?: string
          expires_at: string
          id?: string
          metadata_version: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cache_data?: Json
          cache_key?: string
          created_at?: string
          expires_at?: string
          id?: string
          metadata_version?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_team_invitation: {
        Args: { p_token: string; p_user_id: string }
        Returns: Json
      }
      calculate_qualification_score: {
        Args: {
          budget_confirmed: boolean
          authority_confirmed: boolean
          need_identified: boolean
          timeline_defined: boolean
        }
        Returns: number
      }
      can_user_access_contact: {
        Args: { contact_id: string; user_id: string }
        Returns: boolean
      }
      can_user_manage_product: {
        Args: { product_id: string; user_id: string }
        Returns: boolean
      }
      can_user_view_product: {
        Args: { product_id: string; user_id: string }
        Returns: boolean
      }
      cleanup_expired_invitations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_invitation_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_pipeline_analytics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_subordinate_user_ids: {
        Args: { team_uuid: string; manager_uuid: string }
        Returns: {
          user_id: string
        }[]
      }
      is_team_manager: {
        Args: { team_uuid: string; user_uuid: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { team_uuid: string; user_uuid: string }
        Returns: boolean
      }
      is_team_owner: {
        Args: { team_uuid: string; user_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      pipeline_stage:
        | "Lead"
        | "Qualified"
        | "Proposal"
        | "Negotiation"
        | "Closed Won"
        | "Closed Lost"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      pipeline_stage: [
        "Lead",
        "Qualified",
        "Proposal",
        "Negotiation",
        "Closed Won",
        "Closed Lost",
      ],
    },
  },
} as const
