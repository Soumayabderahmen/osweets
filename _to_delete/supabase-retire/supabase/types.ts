export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      patisserie_waitlist: {
        Row: {
          collection: string;
          created_at: string;
          email: string;
          id: string;
        };
        Insert: {
          collection: string;
          created_at?: string;
          email: string;
          id?: string;
        };
        Update: {
          collection?: string;
          created_at?: string;
          email?: string;
          id?: string;
        };
        Relationships: [];
      };
      product_overrides: {
        Row: {
          allergens: string[] | null;
          collections: string[] | null;
          composition: string[] | null;
          description: string | null;
          family: string | null;
          image_url: string | null;
          in_stock: boolean | null;
          name: string | null;
          pieces: number | null;
          price: number | null;
          published: boolean;
          seasonal_only: boolean | null;
          short_desc: string | null;
          slug: string;
          unit: string | null;
          updated_at: string;
          variants: Json | null;
          weight: string | null;
        };
        Insert: {
          allergens?: string[] | null;
          collections?: string[] | null;
          composition?: string[] | null;
          description?: string | null;
          family?: string | null;
          image_url?: string | null;
          in_stock?: boolean | null;
          name?: string | null;
          pieces?: number | null;
          price?: number | null;
          published?: boolean;
          seasonal_only?: boolean | null;
          short_desc?: string | null;
          slug: string;
          unit?: string | null;
          updated_at?: string;
          variants?: Json | null;
          weight?: string | null;
        };
        Update: {
          allergens?: string[] | null;
          collections?: string[] | null;
          composition?: string[] | null;
          description?: string | null;
          family?: string | null;
          image_url?: string | null;
          in_stock?: boolean | null;
          name?: string | null;
          pieces?: number | null;
          price?: number | null;
          published?: boolean;
          seasonal_only?: boolean | null;
          short_desc?: string | null;
          slug?: string;
          unit?: string | null;
          updated_at?: string;
          variants?: Json | null;
          weight?: string | null;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          slug: string;
          name: string;
          category: string;
          family: string | null;
          flavor_label: string | null;
          price: number;
          price_per_piece: number | null;
          unit: string | null;
          weight: string | null;
          pieces: number | null;
          serves: number | null;
          min_quantity: string | null;
          prep_lead: string | null;
          short_desc: string;
          description: string;
          conservation: string;
          disclaimer: string | null;
          delivery_mode: string | null;
          image_key: string | null;
          image_url: string | null;
          composition: string[];
          ingredients: string[];
          allergens: string[];
          flavors: string[];
          varieties: string[];
          collections: string[];
          availability: string[];
          occasions: string[];
          pack_includes: string[];
          themes: string[];
          badge: string | null;
          variants: Json | null;
          in_stock: boolean;
          published: boolean;
          archived: boolean;
          draft: boolean;
          seasonal_only: boolean;
          local_only: boolean;
          no_cart: boolean;
          hide_price: boolean;
          requires_cold: boolean;
          customizable: boolean | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          category: string;
          family?: string | null;
          flavor_label?: string | null;
          price?: number;
          price_per_piece?: number | null;
          unit?: string | null;
          weight?: string | null;
          pieces?: number | null;
          serves?: number | null;
          min_quantity?: string | null;
          prep_lead?: string | null;
          short_desc?: string;
          description?: string;
          conservation?: string;
          disclaimer?: string | null;
          delivery_mode?: string | null;
          image_key?: string | null;
          image_url?: string | null;
          composition?: string[];
          ingredients?: string[];
          allergens?: string[];
          flavors?: string[];
          varieties?: string[];
          collections?: string[];
          availability?: string[];
          occasions?: string[];
          pack_includes?: string[];
          themes?: string[];
          badge?: string | null;
          variants?: Json | null;
          in_stock?: boolean;
          published?: boolean;
          archived?: boolean;
          draft?: boolean;
          seasonal_only?: boolean;
          local_only?: boolean;
          no_cart?: boolean;
          hide_price?: boolean;
          requires_cold?: boolean;
          customizable?: boolean | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          category?: string;
          family?: string | null;
          flavor_label?: string | null;
          price?: number;
          price_per_piece?: number | null;
          unit?: string | null;
          weight?: string | null;
          pieces?: number | null;
          serves?: number | null;
          min_quantity?: string | null;
          prep_lead?: string | null;
          short_desc?: string;
          description?: string;
          conservation?: string;
          disclaimer?: string | null;
          delivery_mode?: string | null;
          image_key?: string | null;
          image_url?: string | null;
          composition?: string[];
          ingredients?: string[];
          allergens?: string[];
          flavors?: string[];
          varieties?: string[];
          collections?: string[];
          availability?: string[];
          occasions?: string[];
          pack_includes?: string[];
          themes?: string[];
          badge?: string | null;
          variants?: Json | null;
          in_stock?: boolean;
          published?: boolean;
          archived?: boolean;
          draft?: boolean;
          seasonal_only?: boolean;
          local_only?: boolean;
          no_cart?: boolean;
          hide_price?: boolean;
          requires_cold?: boolean;
          customizable?: boolean | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "moderator" | "user";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const;
