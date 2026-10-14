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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      custom_products: {
        Row: {
          colors: string[]
          created_at: string
          description: string
          finish: string
          id: string
          image_urls: string[]
          name: string
          price_pkr: number
          shape: string
          sizes: string[]
        }
        Insert: {
          colors?: string[]
          created_at?: string
          description?: string
          finish?: string
          id?: string
          image_urls?: string[]
          name: string
          price_pkr: number
          shape?: string
          sizes?: string[]
        }
        Update: {
          colors?: string[]
          created_at?: string
          description?: string
          finish?: string
          id?: string
          image_urls?: string[]
          name?: string
          price_pkr?: number
          shape?: string
          sizes?: string[]
        }
        Relationships: []
      }
      customer_bans: {
        Row: {
          banned_at: string
          user_id: string
        }
        Insert: {
          banned_at?: string
          user_id: string
        }
        Update: {
          banned_at?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          custom_mm: string | null
          finish: string
          id: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          shape: string
          size: string
          unit_price_pkr: number
        }
        Insert: {
          custom_mm?: string | null
          finish: string
          id?: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          shape: string
          size: string
          unit_price_pkr: number
        }
        Update: {
          custom_mm?: string | null
          finish?: string
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          shape?: string
          size?: string
          unit_price_pkr?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          area: string
          city: string
          created_at: string
          delivery_pkr: number
          discount_code: string | null
          discount_pkr: number
          full_name: string
          id: string
          phone: string
          postal_code: string
          status: string
          street: string
          subtotal_pkr: number
          total_pkr: number
          user_id: string
        }
        Insert: {
          area: string
          city: string
          created_at?: string
          delivery_pkr?: number
          discount_code?: string | null
          discount_pkr?: number
          full_name: string
          id?: string
          phone: string
          postal_code: string
          status?: string
          street: string
          subtotal_pkr: number
          total_pkr: number
          user_id: string
        }
        Update: {
          area?: string
          city?: string
          created_at?: string
          delivery_pkr?: number
          discount_code?: string | null
          discount_pkr?: number
          full_name?: string
          id?: string
          phone?: string
          postal_code?: string
          status?: string
          street?: string
          subtotal_pkr?: number
          total_pkr?: number
          user_id?: string
        }
        Relationships: []
      }
      product_inventory: {
        Row: {
          oos_colors: string[]
          oos_sizes: string[]
          product_ref: string
          stock: number | null
          updated_at: string
        }
        Insert: {
          oos_colors?: string[]
          oos_sizes?: string[]
          product_ref: string
          stock?: number | null
          updated_at?: string
        }
        Update: {
          oos_colors?: string[]
          oos_sizes?: string[]
          product_ref?: string
          stock?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          description: string
          finish: string
          id: string
          image_url: string
          is_active: boolean
          name: string
          palette: string
          price_pkr: number
          shape: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string
          finish?: string
          id?: string
          image_url: string
          is_active?: boolean
          name: string
          palette?: string
          price_pkr: number
          shape?: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string
          finish?: string
          id?: string
          image_url?: string
          is_active?: boolean
          name?: string
          palette?: string
          price_pkr?: number
          shape?: string
          slug?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          discount_code: string | null
          discount_percent: number
          email: string | null
          free_delivery: boolean
          full_name: string | null
          id: string
          last_seen_at: string | null
          phone: string | null
          signed_in: boolean
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          discount_code?: string | null
          discount_percent?: number
          email?: string | null
          free_delivery?: boolean
          full_name?: string | null
          id: string
          last_seen_at?: string | null
          phone?: string | null
          signed_in?: boolean
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          discount_code?: string | null
          discount_percent?: number
          email?: string | null
          free_delivery?: boolean
          full_name?: string | null
          id?: string
          last_seen_at?: string | null
          phone?: string | null
          signed_in?: boolean
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      shop_orders: {
        Row: {
          area: string
          city: string
          created_at: string
          delivery_pkr: number
          discount_pkr: number
          email: string | null
          full_name: string
          id: string
          items: Json
          payment_method: string
          payment_status: string
          phone: string
          postal_code: string
          status: string
          street: string
          subtotal_pkr: number
          total_pkr: number
          transaction_id: string
          user_id: string
          voucher_code: string | null
        }
        Insert: {
          area: string
          city: string
          created_at?: string
          delivery_pkr?: number
          discount_pkr?: number
          email?: string | null
          full_name: string
          id?: string
          items?: Json
          payment_method?: string
          payment_status?: string
          phone: string
          postal_code: string
          status?: string
          street: string
          subtotal_pkr: number
          total_pkr: number
          transaction_id: string
          user_id: string
          voucher_code?: string | null
        }
        Update: {
          area?: string
          city?: string
          created_at?: string
          delivery_pkr?: number
          discount_pkr?: number
          email?: string | null
          full_name?: string
          id?: string
          items?: Json
          payment_method?: string
          payment_status?: string
          phone?: string
          postal_code?: string
          status?: string
          street?: string
          subtotal_pkr?: number
          total_pkr?: number
          transaction_id?: string
          user_id?: string
          voucher_code?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_spins: {
        Row: {
          discount_percent: number
          free_delivery: boolean
          has_spun: boolean
          prize_label: string
          spun_at: string
          user_id: string
        }
        Insert: {
          discount_percent?: number
          free_delivery?: boolean
          has_spun?: boolean
          prize_label: string
          spun_at?: string
          user_id: string
        }
        Update: {
          discount_percent?: number
          free_delivery?: boolean
          has_spun?: boolean
          prize_label?: string
          spun_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_vouchers: {
        Row: {
          code: string
          discount_percent: number
          free_delivery: boolean
          id: string
          prize_label: string
          used: boolean
          user_id: string
          won_at: string
        }
        Insert: {
          code: string
          discount_percent?: number
          free_delivery?: boolean
          id?: string
          prize_label: string
          used?: boolean
          user_id: string
          won_at?: string
        }
        Update: {
          code?: string
          discount_percent?: number
          free_delivery?: boolean
          id?: string
          prize_label?: string
          used?: boolean
          user_id?: string
          won_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_stock_status: {
        Args: never
        Returns: {
          in_stock: boolean
          oos_colors: string[]
          oos_sizes: string[]
          product_ref: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_banned: { Args: { _user_id: string }; Returns: boolean }
      perform_spin: {
        Args: never
        Returns: {
          already_spun: boolean
          discount_percent: number
          free_delivery: boolean
          prize_label: string
        }[]
      }
      spin_wheel: {
        Args: never
        Returns: {
          cooling_down: boolean
          discount_code: string
          discount_percent: number
          free_delivery: boolean
          prize_label: string
          spun_at: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
