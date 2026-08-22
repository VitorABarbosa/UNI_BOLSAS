// DO NOT EDIT - generated from the Supabase project schema.
// Regenerate with: pnpm db:types
//
// Exception: the `shopee_items` / `shopee_shops` entries were hand-written to
// match 20260822000000_shopee_integration.sql, because the migration is applied
// to the remote project separately. The next `pnpm db:types` run overwrites
// them with the real generated shape.

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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          label: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      product_colors: {
        Row: {
          accent_hex: string | null
          hex: string
          id: string
          name: string
          product_id: string
          sort_order: number
        }
        Insert: {
          accent_hex?: string | null
          hex: string
          id?: string
          name: string
          product_id: string
          sort_order?: number
        }
        Update: {
          accent_hex?: string | null
          hex?: string
          id?: string
          name?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_colors_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt: string | null
          color_id: string | null
          id: string
          product_id: string
          sort_order: number
          storage_path: string
        }
        Insert: {
          alt?: string | null
          color_id?: string | null
          id?: string
          product_id: string
          sort_order?: number
          storage_path: string
        }
        Update: {
          alt?: string | null
          color_id?: string | null
          id?: string
          product_id?: string
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "product_colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          badge: string | null
          category_id: string
          created_at: string
          description: string | null
          dimensions: string | null
          id: string
          material: string | null
          name: string
          price_retail: number
          price_wholesale: string | null
          seo_description: string | null
          seo_title: string | null
          sizes: string[]
          slug: string
          sort_order: number
          tagline: string | null
          updated_at: string
          weight: string | null
        }
        Insert: {
          active?: boolean
          badge?: string | null
          category_id: string
          created_at?: string
          description?: string | null
          dimensions?: string | null
          id?: string
          material?: string | null
          name: string
          price_retail: number
          price_wholesale?: string | null
          seo_description?: string | null
          seo_title?: string | null
          sizes?: string[]
          slug: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
          weight?: string | null
        }
        Update: {
          active?: boolean
          badge?: string | null
          category_id?: string
          created_at?: string
          description?: string | null
          dimensions?: string | null
          id?: string
          material?: string | null
          name?: string
          price_retail?: number
          price_wholesale?: string | null
          seo_description?: string | null
          seo_title?: string | null
          sizes?: string[]
          slug?: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      shopee_items: {
        Row: {
          created_at: string
          currency: string
          has_model: boolean
          id: string
          image_url: string | null
          item_id: number
          item_name: string
          item_sku: string | null
          item_status: string
          item_url: string
          original_price: number | null
          price: number | null
          product_id: string | null
          shop_id: number
          shopee_update_time: string | null
          stock: number | null
          synced_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          has_model?: boolean
          id?: string
          image_url?: string | null
          item_id: number
          item_name: string
          item_sku?: string | null
          item_status: string
          item_url: string
          original_price?: number | null
          price?: number | null
          product_id?: string | null
          shop_id: number
          shopee_update_time?: string | null
          stock?: number | null
          synced_at?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          has_model?: boolean
          id?: string
          image_url?: string | null
          item_id?: number
          item_name?: string
          item_sku?: string | null
          item_status?: string
          item_url?: string
          original_price?: number | null
          price?: number | null
          product_id?: string | null
          shop_id?: number
          shopee_update_time?: string | null
          stock?: number | null
          synced_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopee_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopee_items_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shopee_shops"
            referencedColumns: ["shop_id"]
          },
        ]
      }
      shopee_shops: {
        Row: {
          access_token: string
          authorized_at: string
          expires_at: string
          last_sync_at: string | null
          last_sync_error: string | null
          last_sync_item_count: number | null
          refresh_expires_at: string
          refresh_token: string
          region: string
          shop_id: number
          shop_name: string | null
          updated_at: string
        }
        Insert: {
          access_token: string
          authorized_at?: string
          expires_at: string
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_item_count?: number | null
          refresh_expires_at: string
          refresh_token: string
          region?: string
          shop_id: number
          shop_name?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string
          authorized_at?: string
          expires_at?: string
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_item_count?: number | null
          refresh_expires_at?: string
          refresh_token?: string
          region?: string
          shop_id?: number
          shop_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
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
