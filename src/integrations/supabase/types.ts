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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      boardings: {
        Row: {
          additional_cost: number
          check_in_date: string
          check_out_date: string
          created_at: string
          daily_rate: number
          dog_id: string
          feeding_schedule: string | null
          id: string
          kennel_number: string | null
          notes: string | null
          owner_id: string
          paid_amount: number
          payment_method: string | null
          payment_status: string
          special_requests: string | null
          status: Database["public"]["Enums"]["boarding_status"]
          total_cost: number
          user_id: string
        }
        Insert: {
          additional_cost?: number
          check_in_date: string
          check_out_date: string
          created_at?: string
          daily_rate?: number
          dog_id: string
          feeding_schedule?: string | null
          id?: string
          kennel_number?: string | null
          notes?: string | null
          owner_id: string
          paid_amount?: number
          payment_method?: string | null
          payment_status?: string
          special_requests?: string | null
          status?: Database["public"]["Enums"]["boarding_status"]
          total_cost?: number
          user_id?: string
        }
        Update: {
          additional_cost?: number
          check_in_date?: string
          check_out_date?: string
          created_at?: string
          daily_rate?: number
          dog_id?: string
          feeding_schedule?: string | null
          id?: string
          kennel_number?: string | null
          notes?: string | null
          owner_id?: string
          paid_amount?: number
          payment_method?: string | null
          payment_status?: string
          special_requests?: string | null
          status?: Database["public"]["Enums"]["boarding_status"]
          total_cost?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boardings_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boardings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_requests: {
        Row: {
          client_email: string | null
          client_name: string
          client_phone: string
          created_at: string
          dog_breed: string | null
          dog_name: string
          dog_photo_url: string | null
          id: string
          message: string | null
          preferred_check_in: string
          preferred_check_out: string
          special_needs: string | null
          status: string
          user_id: string
        }
        Insert: {
          client_email?: string | null
          client_name: string
          client_phone: string
          created_at?: string
          dog_breed?: string | null
          dog_name: string
          dog_photo_url?: string | null
          id?: string
          message?: string | null
          preferred_check_in: string
          preferred_check_out: string
          special_needs?: string | null
          status?: string
          user_id: string
        }
        Update: {
          client_email?: string | null
          client_name?: string
          client_phone?: string
          created_at?: string
          dog_breed?: string | null
          dog_name?: string
          dog_photo_url?: string | null
          id?: string
          message?: string | null
          preferred_check_in?: string
          preferred_check_out?: string
          special_needs?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          company_address: string | null
          company_email: string | null
          company_name: string
          company_phone: string | null
          created_at: string
          gst_number: string | null
          id: string
          logo_url: string | null
          updated_at: string
          user_id: string
          whatsapp_number: string | null
        }
        Insert: {
          company_address?: string | null
          company_email?: string | null
          company_name?: string
          company_phone?: string | null
          created_at?: string
          gst_number?: string | null
          id?: string
          logo_url?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_number?: string | null
        }
        Update: {
          company_address?: string | null
          company_email?: string | null
          company_name?: string
          company_phone?: string | null
          created_at?: string
          gst_number?: string | null
          id?: string
          logo_url?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      dogs: {
        Row: {
          age: number
          age_months: number
          breed: string
          created_at: string
          feeding_instructions: string | null
          gender: string
          id: string
          medications: string | null
          name: string
          neutered: boolean
          owner_id: string
          photo_url: string | null
          special_needs: string | null
          user_id: string
          vaccinated: boolean
          vaccine_photo_url: string | null
          weight: number
        }
        Insert: {
          age?: number
          age_months?: number
          breed?: string
          created_at?: string
          feeding_instructions?: string | null
          gender?: string
          id?: string
          medications?: string | null
          name: string
          neutered?: boolean
          owner_id: string
          photo_url?: string | null
          special_needs?: string | null
          user_id?: string
          vaccinated?: boolean
          vaccine_photo_url?: string | null
          weight?: number
        }
        Update: {
          age?: number
          age_months?: number
          breed?: string
          created_at?: string
          feeding_instructions?: string | null
          gender?: string
          id?: string
          medications?: string | null
          name?: string
          neutered?: boolean
          owner_id?: string
          photo_url?: string | null
          special_needs?: string | null
          user_id?: string
          vaccinated?: boolean
          vaccine_photo_url?: string | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "dogs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      foster_dogs: {
        Row: {
          age: number
          age_months: number
          breed: string
          created_at: string
          feeding_instructions: string | null
          gender: string
          id: string
          medications: string | null
          name: string
          neutered: boolean
          owner_id: string
          photo_url: string | null
          special_needs: string | null
          user_id: string
          vaccinated: boolean
          vaccine_photo_url: string | null
          weight: number
        }
        Insert: {
          age?: number
          age_months?: number
          breed?: string
          created_at?: string
          feeding_instructions?: string | null
          gender?: string
          id?: string
          medications?: string | null
          name: string
          neutered?: boolean
          owner_id: string
          photo_url?: string | null
          special_needs?: string | null
          user_id?: string
          vaccinated?: boolean
          vaccine_photo_url?: string | null
          weight?: number
        }
        Update: {
          age?: number
          age_months?: number
          breed?: string
          created_at?: string
          feeding_instructions?: string | null
          gender?: string
          id?: string
          medications?: string | null
          name?: string
          neutered?: boolean
          owner_id?: string
          photo_url?: string | null
          special_needs?: string | null
          user_id?: string
          vaccinated?: boolean
          vaccine_photo_url?: string | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "foster_dogs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "foster_owners"
            referencedColumns: ["id"]
          },
        ]
      }
      foster_owners: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          emergency_contact: string | null
          id: string
          name: string
          phone: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          emergency_contact?: string | null
          id?: string
          name: string
          phone: string
          user_id?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          emergency_contact?: string | null
          id?: string
          name?: string
          phone?: string
          user_id?: string
        }
        Relationships: []
      }
      fosters: {
        Row: {
          additional_cost: number
          animal_type: string
          check_in_date: string
          check_out_date: string
          created_at: string
          daily_rate: number
          dog_id: string
          feeding_schedule: string | null
          id: string
          kennel_number: string | null
          notes: string | null
          owner_id: string
          paid_amount: number
          payment_method: string | null
          payment_status: string
          special_requests: string | null
          status: Database["public"]["Enums"]["boarding_status"]
          total_cost: number
          user_id: string
        }
        Insert: {
          additional_cost?: number
          animal_type?: string
          check_in_date: string
          check_out_date: string
          created_at?: string
          daily_rate?: number
          dog_id: string
          feeding_schedule?: string | null
          id?: string
          kennel_number?: string | null
          notes?: string | null
          owner_id: string
          paid_amount?: number
          payment_method?: string | null
          payment_status?: string
          special_requests?: string | null
          status?: Database["public"]["Enums"]["boarding_status"]
          total_cost?: number
          user_id?: string
        }
        Update: {
          additional_cost?: number
          animal_type?: string
          check_in_date?: string
          check_out_date?: string
          created_at?: string
          daily_rate?: number
          dog_id?: string
          feeding_schedule?: string | null
          id?: string
          kennel_number?: string | null
          notes?: string | null
          owner_id?: string
          paid_amount?: number
          payment_method?: string | null
          payment_status?: string
          special_requests?: string | null
          status?: Database["public"]["Enums"]["boarding_status"]
          total_cost?: number
          user_id?: string
        }
        Relationships: []
      }
      owners: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          emergency_contact: string | null
          id: string
          name: string
          phone: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          emergency_contact?: string | null
          id?: string
          name: string
          phone: string
          user_id?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          emergency_contact?: string | null
          id?: string
          name?: string
          phone?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      boarding_status: "reserved" | "checked-in" | "checked-out" | "cancelled"
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
      boarding_status: ["reserved", "checked-in", "checked-out", "cancelled"],
    },
  },
} as const
