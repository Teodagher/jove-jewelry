export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      cart_items: {
        Row: {
          base_price: number
          created_at: string | null
          customization_data: Json
          id: string
          jewelry_type: string
          preview_image_url: string | null
          product_name: string | null
          quantity: number
          session_id: string
          total_price: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          base_price?: number
          created_at?: string | null
          customization_data?: Json
          id?: string
          jewelry_type?: string
          preview_image_url?: string | null
          product_name?: string | null
          quantity?: number
          session_id: string
          total_price?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          base_price?: number
          created_at?: string | null
          customization_data?: Json
          id?: string
          jewelry_type?: string
          preview_image_url?: string | null
          product_name?: string | null
          quantity?: number
          session_id?: string
          total_price?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          email: string
          first_order_date: string | null
          id: string
          last_order_date: string | null
          name: string
          phone: string | null
          total_orders: number
          total_spent: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_order_date?: string | null
          id?: string
          last_order_date?: string | null
          name: string
          phone?: string | null
          total_orders?: number
          total_spent?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_order_date?: string | null
          id?: string
          last_order_date?: string | null
          name?: string
          phone?: string | null
          total_orders?: number
          total_spent?: number
          updated_at?: string
        }
        Relationships: []
      }
      customization_logic_rules: {
        Row: {
          action_type: string
          condition_option_id: string
          condition_setting_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          jewelry_item_id: string
          price_multiplier: number | null
          rule_name: string
          target_option_ids: string[] | null
          target_setting_id: string
          updated_at: string | null
        }
        Insert: {
          action_type: string
          condition_option_id: string
          condition_setting_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          jewelry_item_id: string
          price_multiplier?: number | null
          rule_name: string
          target_option_ids?: string[] | null
          target_setting_id: string
          updated_at?: string | null
        }
        Update: {
          action_type?: string
          condition_option_id?: string
          condition_setting_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          jewelry_item_id?: string
          price_multiplier?: number | null
          rule_name?: string
          target_option_ids?: string[] | null
          target_setting_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customization_logic_rules_jewelry_item_id_fkey"
            columns: ["jewelry_item_id"]
            isOneToOne: false
            referencedRelation: "jewelry_items"
            referencedColumns: ["id"]
          },
        ]
      }
      customization_options: {
        Row: {
          affects_image_variant: boolean | null
          color_gradient: string | null
          created_at: string | null
          display_order: number | null
          filename_slug: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          jewelry_item_id: string | null
          option_id: string
          option_name: string
          price: number
          price_au: number | null
          price_gold: number | null
          price_gold_au: number | null
          price_lab_grown: number | null
          price_lab_grown_au: number | null
          price_silver: number | null
          price_silver_au: number | null
          required: boolean | null
          setting_description: string | null
          setting_display_order: number | null
          setting_id: string
          setting_title: string
          updated_at: string | null
        }
        Insert: {
          affects_image_variant?: boolean | null
          color_gradient?: string | null
          created_at?: string | null
          display_order?: number | null
          filename_slug?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          jewelry_item_id?: string | null
          option_id: string
          option_name: string
          price?: number
          price_au?: number | null
          price_gold?: number | null
          price_gold_au?: number | null
          price_lab_grown?: number | null
          price_lab_grown_au?: number | null
          price_silver?: number | null
          price_silver_au?: number | null
          required?: boolean | null
          setting_description?: string | null
          setting_display_order?: number | null
          setting_id: string
          setting_title: string
          updated_at?: string | null
        }
        Update: {
          affects_image_variant?: boolean | null
          color_gradient?: string | null
          created_at?: string | null
          display_order?: number | null
          filename_slug?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          jewelry_item_id?: string | null
          option_id?: string
          option_name?: string
          price?: number
          price_au?: number | null
          price_gold?: number | null
          price_gold_au?: number | null
          price_lab_grown?: number | null
          price_lab_grown_au?: number | null
          price_silver?: number | null
          price_silver_au?: number | null
          required?: boolean | null
          setting_description?: string | null
          setting_display_order?: number | null
          setting_id?: string
          setting_title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customization_options_jewelry_item_id_fkey"
            columns: ["jewelry_item_id"]
            isOneToOne: false
            referencedRelation: "jewelry_items"
            referencedColumns: ["id"]
          },
        ]
      }
      giveaway_participants: {
        Row: {
          created_at: string | null
          giveaway_id: string
          id: string
          lead_id: string
        }
        Insert: {
          created_at?: string | null
          giveaway_id: string
          id?: string
          lead_id: string
        }
        Update: {
          created_at?: string | null
          giveaway_id?: string
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "giveaway_participants_giveaway_id_fkey"
            columns: ["giveaway_id"]
            isOneToOne: false
            referencedRelation: "giveaways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "giveaway_participants_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      giveaways: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          slug: string
          status: string | null
          updated_at: string | null
          winner_id: string | null
          winner_selected_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
          status?: string | null
          updated_at?: string | null
          winner_id?: string | null
          winner_selected_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
          status?: string | null
          updated_at?: string | null
          winner_id?: string | null
          winner_selected_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "giveaways_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "giveaways_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      jewelry_items: {
        Row: {
          base_image_url: string | null
          base_price: number
          base_price_au: number | null
          base_price_gold: number | null
          base_price_gold_au: number | null
          base_price_lab_grown: number | null
          base_price_lab_grown_au: number | null
          base_price_silver: number | null
          base_price_silver_au: number | null
          black_onyx_base_price: number | null
          black_onyx_base_price_au: number | null
          black_onyx_base_price_gold: number | null
          black_onyx_base_price_gold_au: number | null
          black_onyx_base_price_lab_grown: number | null
          black_onyx_base_price_lab_grown_au: number | null
          black_onyx_base_price_silver: number | null
          black_onyx_base_price_silver_au: number | null
          category_id: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          pricing_type: string | null
          product_type: string | null
          slug: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          base_image_url?: string | null
          base_price?: number
          base_price_au?: number | null
          base_price_gold?: number | null
          base_price_gold_au?: number | null
          base_price_lab_grown?: number | null
          base_price_lab_grown_au?: number | null
          base_price_silver?: number | null
          base_price_silver_au?: number | null
          black_onyx_base_price?: number | null
          black_onyx_base_price_au?: number | null
          black_onyx_base_price_gold?: number | null
          black_onyx_base_price_gold_au?: number | null
          black_onyx_base_price_lab_grown?: number | null
          black_onyx_base_price_lab_grown_au?: number | null
          black_onyx_base_price_silver?: number | null
          black_onyx_base_price_silver_au?: number | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          pricing_type?: string | null
          product_type?: string | null
          slug?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          base_image_url?: string | null
          base_price?: number
          base_price_au?: number | null
          base_price_gold?: number | null
          base_price_gold_au?: number | null
          base_price_lab_grown?: number | null
          base_price_lab_grown_au?: number | null
          base_price_silver?: number | null
          base_price_silver_au?: number | null
          black_onyx_base_price?: number | null
          black_onyx_base_price_au?: number | null
          black_onyx_base_price_gold?: number | null
          black_onyx_base_price_gold_au?: number | null
          black_onyx_base_price_lab_grown?: number | null
          black_onyx_base_price_lab_grown_au?: number | null
          black_onyx_base_price_silver?: number | null
          black_onyx_base_price_silver_au?: number | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          pricing_type?: string | null
          product_type?: string | null
          slug?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jewelry_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          phone_number: string
          source: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          phone_number: string
          source: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone_number?: string
          source?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          base_price: number
          created_at: string | null
          customization_data: Json
          customization_summary: string | null
          id: string
          jewelry_type: string
          order_id: string
          preview_image_url: string | null
          product_name: string | null
          quantity: number
          subtotal: number
          total_price: number
        }
        Insert: {
          base_price?: number
          created_at?: string | null
          customization_data?: Json
          customization_summary?: string | null
          id?: string
          jewelry_type?: string
          order_id: string
          preview_image_url?: string | null
          product_name?: string | null
          quantity?: number
          subtotal: number
          total_price?: number
        }
        Update: {
          base_price?: number
          created_at?: string | null
          customization_data?: Json
          customization_summary?: string | null
          id?: string
          jewelry_type?: string
          order_id?: string
          preview_image_url?: string | null
          product_name?: string | null
          quantity?: number
          subtotal?: number
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          customer_email: string
          customer_info: Json | null
          customer_name: string
          customer_phone: string
          delivery_address: string
          delivery_address_json: Json | null
          delivery_city: string
          delivery_fee: number | null
          delivery_latitude: number | null
          delivery_longitude: number | null
          delivery_notes: string | null
          delivery_postal_code: string | null
          discount_amount: number | null
          discount_code: string | null
          discount_type: string | null
          discount_value: number | null
          id: string
          items: Json | null
          notes: string | null
          order_notes: string | null
          order_number: string | null
          payment_method: string | null
          status: string | null
          subtotal: number
          total: number
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_email: string
          customer_info?: Json | null
          customer_name: string
          customer_phone: string
          delivery_address: string
          delivery_address_json?: Json | null
          delivery_city: string
          delivery_fee?: number | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          delivery_notes?: string | null
          delivery_postal_code?: string | null
          discount_amount?: number | null
          discount_code?: string | null
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          items?: Json | null
          notes?: string | null
          order_notes?: string | null
          order_number?: string | null
          payment_method?: string | null
          status?: string | null
          subtotal: number
          total: number
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_email?: string
          customer_info?: Json | null
          customer_name?: string
          customer_phone?: string
          delivery_address?: string
          delivery_address_json?: Json | null
          delivery_city?: string
          delivery_fee?: number | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          delivery_notes?: string | null
          delivery_postal_code?: string | null
          discount_amount?: number | null
          discount_code?: string | null
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          items?: Json | null
          notes?: string | null
          order_notes?: string | null
          order_number?: string | null
          payment_method?: string | null
          status?: string | null
          subtotal?: number
          total?: number
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      product_descriptions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          product_type: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          product_type: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          product_type?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          auth_user_id: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          roles: string[] | null
          updated_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          roles?: string[] | null
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          roles?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_order_number: { Args: never; Returns: string }
      get_customers_with_order_stats: {
        Args: never
        Returns: {
          created_at: string
          email: string
          first_order_date: string
          id: string
          last_order_date: string
          name: string
          phone: string
          total_orders: number
          total_spent: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
