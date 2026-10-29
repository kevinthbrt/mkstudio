export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string | null;
          role: "admin" | "member";
          collective_balance: number;
          individual_balance: number;
          duo_balance: number;
          legal_status: string | null;
          charter_accepted_at: string | null;
          date_of_birth: string | null;
          is_test_account: boolean;
          marketing_opt_in: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string | null;
          role?: "admin" | "member";
          collective_balance?: number;
          individual_balance?: number;
          duo_balance?: number;
          legal_status?: string | null;
          charter_accepted_at?: string | null;
          date_of_birth?: string | null;
          is_test_account?: boolean;
          marketing_opt_in?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string | null;
          role?: "admin" | "member";
          collective_balance?: number;
          individual_balance?: number;
          duo_balance?: number;
          legal_status?: string | null;
          charter_accepted_at?: string | null;
          date_of_birth?: string | null;
          is_test_account?: boolean;
          marketing_opt_in?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      email_campaigns: {
        Row: {
          id: string;
          type: "announcement" | "promotion" | "massage";
          subject: string;
          title: string;
          recipient_count: number;
          sent_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: "announcement" | "promotion" | "massage";
          subject: string;
          title: string;
          recipient_count?: number;
          sent_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: "announcement" | "promotion" | "massage";
          subject?: string;
          title?: string;
          recipient_count?: number;
          sent_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          session_count: number;
          session_type: "collective" | "individual" | "duo" | "massage";
          active: boolean;
          is_massage: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price: number;
          session_count: number;
          session_type?: "collective" | "individual" | "duo" | "massage";
          active?: boolean;
          is_massage?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          session_count?: number;
          session_type?: "collective" | "individual" | "duo" | "massage";
          active?: boolean;
          is_massage?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          member_id: string | null;
          product_id: string;
          amount: number;
          sessions_purchased: number;
          invoice_number: string;
          status: "pending" | "paid" | "cancelled";
          payment_method: string | null;
          guest_name: string | null;
          guest_email: string | null;
          created_at: string;
          paid_at: string | null;
        };
        Insert: {
          id?: string;
          member_id?: string | null;
          product_id: string;
          amount: number;
          sessions_purchased: number;
          invoice_number?: string;
          status?: "pending" | "paid" | "cancelled";
          payment_method?: string | null;
          guest_name?: string | null;
          guest_email?: string | null;
          created_at?: string;
          paid_at?: string | null;
        };
        Update: {
          id?: string;
          member_id?: string | null;
          product_id?: string;
          amount?: number;
          sessions_purchased?: number;
          invoice_number?: string;
          status?: "pending" | "paid" | "cancelled";
          payment_method?: string | null;
          paid_at?: string | null;
        };
        Relationships: [];
      };
      invoice_settings: {
        Row: {
          id: string;
          business_name: string;
          owner_name: string;
          address: string;
          city: string;
          postal_code: string;
          country: string;
          email: string;
          phone: string;
          siret: string;
          ape_code: string | null;
          tva_mention: string;
          payment_terms: string;
          invoice_prefix: string;
          next_invoice_number: number;
          logo_url: string | null;
          bank_details: string | null;
          stamp_url: string | null;
          legal_status: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_name: string;
          owner_name: string;
          address: string;
          city: string;
          postal_code: string;
          country?: string;
          email: string;
          phone: string;
          siret: string;
          ape_code?: string | null;
          tva_mention?: string;
          payment_terms?: string;
          invoice_prefix?: string;
          next_invoice_number?: number;
          logo_url?: string | null;
          bank_details?: string | null;
          stamp_url?: string | null;
          legal_status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          business_name?: string;
          owner_name?: string;
          address?: string;
          city?: string;
          postal_code?: string;
          country?: string;
          email?: string;
          phone?: string;
          siret?: string;
          ape_code?: string | null;
          tva_mention?: string;
          payment_terms?: string;
          invoice_prefix?: string;
          next_invoice_number?: number;
          logo_url?: string | null;
          bank_details?: string | null;
          stamp_url?: string | null;
          legal_status?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      class_types: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          color: string;
          duration_minutes: number;
          is_massage: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          color?: string;
          duration_minutes: number;
          is_massage?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          color?: string;
          duration_minutes?: number;
          is_massage?: boolean;
        };
        Relationships: [];
      };
      class_sessions: {
        Row: {
          id: string;
          class_type_id: string;
          coach_name: string;
          start_time: string;
          end_time: string;
          max_participants: number;
          current_participants: number;
          min_cancel_hours: number;
          is_cancelled: boolean;
          is_hidden: boolean;
          recurring_rule: string | null;
          session_type: "collective" | "individual" | "duo" | "massage";
          assigned_member_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          class_type_id: string;
          coach_name: string;
          start_time: string;
          end_time: string;
          max_participants: number;
          current_participants?: number;
          min_cancel_hours?: number;
          is_cancelled?: boolean;
          is_hidden?: boolean;
          recurring_rule?: string | null;
          session_type?: "collective" | "individual" | "duo" | "massage";
          assigned_member_id?: string | null;
          created_at?: string;
        };
        Update: {
          class_type_id?: string;
          coach_name?: string;
          start_time?: string;
          end_time?: string;
          max_participants?: number;
          current_participants?: number;
          min_cancel_hours?: number;
          is_cancelled?: boolean;
          is_hidden?: boolean;
          recurring_rule?: string | null;
          session_type?: "collective" | "individual" | "duo" | "massage";
          assigned_member_id?: string | null;
        };
        Relationships: [];
      };
      class_bookings: {
        Row: {
          id: string;
          member_id: string | null;
          class_session_id: string;
          status: "confirmed" | "cancelled";
          session_debited: boolean;
          guest_names: string | null;
          massage_product_id: string | null;
          massage_price: number | null;
          massage_discount_applied: boolean;
          invoice_order_id: string | null;
          guest_name: string | null;
          guest_email: string | null;
          booked_at: string;
          cancelled_at: string | null;
        };
        Insert: {
          id?: string;
          member_id?: string | null;
          class_session_id: string;
          status?: "confirmed" | "cancelled";
          session_debited?: boolean;
          guest_names?: string | null;
          massage_product_id?: string | null;
          massage_price?: number | null;
          massage_discount_applied?: boolean;
          invoice_order_id?: string | null;
          guest_name?: string | null;
          guest_email?: string | null;
          booked_at?: string;
          cancelled_at?: string | null;
        };
        Update: {
          status?: "confirmed" | "cancelled";
          session_debited?: boolean;
          guest_names?: string | null;
          massage_price?: number | null;
          massage_discount_applied?: boolean;
          invoice_order_id?: string | null;
          cancelled_at?: string | null;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at?: string;
        };
        Update: {
          endpoint?: string;
          p256dh?: string;
          auth?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          date: string;
          description: string;
          category: string;
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          description: string;
          category: string;
          amount: number;
          created_at?: string;
        };
        Update: {
          date?: string;
          description?: string;
          category?: string;
          amount?: number;
        };
        Relationships: [];
      };
      merch_sales: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          closes_at: string;
          payment_instructions: string | null;
          status: "draft" | "open" | "supplier_ordered" | "completed";
          announced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          closes_at: string;
          payment_instructions?: string | null;
          status?: "draft" | "open" | "supplier_ordered" | "completed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          announced_at?: string | null;
          title?: string;
          description?: string | null;
          closes_at?: string;
          payment_instructions?: string | null;
          status?: "draft" | "open" | "supplier_ordered" | "completed";
        };
        Relationships: [];
      };
      merch_items: {
        Row: {
          id: string;
          sale_id: string;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          images: string[];
          variants: string[];
          position: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sale_id: string;
          name: string;
          description?: string | null;
          price: number;
          image_url?: string | null;
          images?: string[];
          variants?: string[];
          position?: number;
          active?: boolean;
        };
        Update: {
          name?: string;
          description?: string | null;
          price?: number;
          image_url?: string | null;
          images?: string[];
          variants?: string[];
          position?: number;
          active?: boolean;
        };
        Relationships: [];
      };
      merch_orders: {
        Row: {
          id: string;
          sale_id: string;
          member_id: string;
          status: "confirmed" | "cancelled";
          payment_method: "cheque" | "virement" | "especes";
          total: number;
          note: string | null;
          paid_at: string | null;
          paid_amount: number | null;
          delivered_at: string | null;
          cancelled_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          sale_id: string;
          member_id: string;
          status?: "confirmed" | "cancelled";
          payment_method: "cheque" | "virement" | "especes";
          total: number;
          note?: string | null;
        };
        Update: {
          status?: "confirmed" | "cancelled";
          paid_at?: string | null;
          paid_amount?: number | null;
          delivered_at?: string | null;
          cancelled_at?: string | null;
        };
        Relationships: [];
      };
      merch_order_lines: {
        Row: {
          id: string;
          order_id: string;
          item_id: string | null;
          item_name: string;
          variant: string | null;
          quantity: number;
          unit_price: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          item_id?: string | null;
          item_name: string;
          variant?: string | null;
          quantity: number;
          unit_price: number;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      merch_settings: {
        Row: {
          id: boolean;
          shop_enabled: boolean;
          updated_at: string;
        };
        Insert: {
          id?: boolean;
          shop_enabled?: boolean;
          updated_at?: string;
        };
        Update: {
          shop_enabled?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      manual_incomes: {
        Row: {
          id: string;
          date: string;
          description: string;
          amount: number;
          payment_method: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          description: string;
          amount: number;
          payment_method?: string | null;
          created_at?: string;
        };
        Update: {
          date?: string;
          description?: string;
          amount?: number;
          payment_method?: string | null;
        };
        Relationships: [];
      };
      class_waitlists: {
        Row: {
          id: string;
          member_id: string;
          class_session_id: string;
          position: number;
          status: "waiting" | "promoted" | "cancelled";
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          class_session_id: string;
          position: number;
          status?: "waiting" | "promoted" | "cancelled";
          created_at?: string;
        };
        Update: {
          status?: "waiting" | "promoted" | "cancelled";
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]?: never;
    };
    Functions: {
      increment_collective_balance: {
        Args: { p_member_id: string };
        Returns: undefined;
      };
      decrement_collective_balance: {
        Args: { p_member_id: string };
        Returns: undefined;
      };
      increment_individual_balance: {
        Args: { p_member_id: string };
        Returns: undefined;
      };
      decrement_individual_balance: {
        Args: { p_member_id: string };
        Returns: undefined;
      };
      increment_duo_balance: {
        Args: { p_member_id: string };
        Returns: undefined;
      };
      decrement_duo_balance: {
        Args: { p_member_id: string };
        Returns: undefined;
      };
      increment_session_balance: {
        Args: { p_member_id: string };
        Returns: undefined;
      };
      decrement_session_balance: {
        Args: { p_member_id: string };
        Returns: undefined;
      };
      increment_participants: {
        Args: { session_id: string };
        Returns: undefined;
      };
      decrement_participants: {
        Args: { session_id: string };
        Returns: undefined;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      join_waitlist: {
        Args: { p_member_id: string; p_session_id: string };
        Returns: number;
      };
      get_waitlist_count: {
        Args: { p_session_id: string };
        Returns: number;
      };
      book_collective_session: {
        Args: { p_member_id: string; p_session_id: string; p_guest_names?: string | null };
        Returns: { success: boolean; error?: string; spots_left?: number; balance?: number; spots_used?: number; new_balance?: number };
      };
      admin_save_merch_order: {
        Args: {
          p_order_id: string | null;
          p_sale_id: string;
          p_member_id: string;
          p_payment_method: string;
          p_lines: { item_id: string; variant: string | null; quantity: number }[];
          p_note?: string | null;
        };
        Returns: {
          success: boolean;
          error?: string;
          order_id?: string;
          created?: boolean;
          total?: number;
          previous_total?: number | null;
        };
      };
      place_merch_order: {
        Args: {
          p_member_id: string;
          p_sale_id: string;
          p_payment_method: string;
          p_lines: { item_id: string; variant: string | null; quantity: number }[];
          p_note?: string | null;
        };
        Returns: { success: boolean; error?: string; order_id?: string; total?: number };
      };
      cancel_merch_order: {
        Args: { p_member_id: string; p_order_id: string };
        Returns: { success: boolean; error?: string };
      };
      book_massage_session: {
        Args: {
          p_session_id: string;
          p_product_id: string;
          p_price: number;
          p_discount_applied: boolean;
          p_member_id?: string | null;
          p_guest_name?: string | null;
          p_guest_email?: string | null;
        };
        Returns: { success: boolean; error?: string };
      };
    };
    Enums: {
      [_ in never]?: never;
    };
    CompositeTypes: {
      [_ in never]?: never;
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type InvoiceSettings = Database["public"]["Tables"]["invoice_settings"]["Row"];
export type ClassType = Database["public"]["Tables"]["class_types"]["Row"];
export type ClassSession = Database["public"]["Tables"]["class_sessions"]["Row"];
export type ClassBooking = Database["public"]["Tables"]["class_bookings"]["Row"];
export type WaitlistEntry = Database["public"]["Tables"]["class_waitlists"]["Row"];
export type Expense = Database["public"]["Tables"]["expenses"]["Row"];
export type ManualIncome = Database["public"]["Tables"]["manual_incomes"]["Row"];
export type MerchSale = Database["public"]["Tables"]["merch_sales"]["Row"];
export type MerchItem = Database["public"]["Tables"]["merch_items"]["Row"];
export type MerchOrder = Database["public"]["Tables"]["merch_orders"]["Row"];
export type MerchOrderLine = Database["public"]["Tables"]["merch_order_lines"]["Row"];
