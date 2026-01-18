// ==========================================
// CERCA - Tipos de Base de Datos Supabase
// ==========================================

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
      users: {
        Row: {
          id: string;
          phone: string;
          email: string | null;
          first_name: string;
          last_name: string;
          profile_photo: string | null;
          role: 'passenger' | 'driver' | 'both';
          rating: number;
          total_trips: number;
          tokens: number;
          credits: number;
          is_premium: boolean;
          is_verified: boolean;
          emergency_contacts: Json;
          preferences: Json;
          reputation: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          phone: string;
          email?: string | null;
          first_name: string;
          last_name: string;
          profile_photo?: string | null;
          role?: 'passenger' | 'driver' | 'both';
          rating?: number;
          total_trips?: number;
          tokens?: number;
          credits?: number;
          is_premium?: boolean;
          is_verified?: boolean;
          emergency_contacts?: Json;
          preferences?: Json;
          reputation?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          phone?: string;
          email?: string | null;
          first_name?: string;
          last_name?: string;
          profile_photo?: string | null;
          role?: 'passenger' | 'driver' | 'both';
          rating?: number;
          total_trips?: number;
          tokens?: number;
          credits?: number;
          is_premium?: boolean;
          is_verified?: boolean;
          emergency_contacts?: Json;
          preferences?: Json;
          reputation?: Json;
          updated_at?: string;
        };
      };
      drivers: {
        Row: {
          id: string;
          user_id: string;
          vehicle_id: string | null;
          is_online: boolean;
          acceptance_rate: number;
          cancellation_rate: number;
          blocked_users: string[];
          favorite_passengers: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vehicle_id?: string | null;
          is_online?: boolean;
          acceptance_rate?: number;
          cancellation_rate?: number;
          blocked_users?: string[];
          favorite_passengers?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          vehicle_id?: string | null;
          is_online?: boolean;
          acceptance_rate?: number;
          cancellation_rate?: number;
          blocked_users?: string[];
          favorite_passengers?: string[];
          updated_at?: string;
        };
      };
      vehicles: {
        Row: {
          id: string;
          driver_id: string;
          plate: string;
          brand: string;
          model: string;
          year: number;
          color: string;
          type: 'sedan' | 'suv' | 'van' | 'motorcycle' | 'taxi';
          photos: string[];
          accessibility: string[];
          capacity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          driver_id: string;
          plate: string;
          brand: string;
          model: string;
          year: number;
          color: string;
          type: 'sedan' | 'suv' | 'van' | 'motorcycle' | 'taxi';
          photos?: string[];
          accessibility?: string[];
          capacity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          plate?: string;
          brand?: string;
          model?: string;
          year?: number;
          color?: string;
          type?: 'sedan' | 'suv' | 'van' | 'motorcycle' | 'taxi';
          photos?: string[];
          accessibility?: string[];
          capacity?: number;
          updated_at?: string;
        };
      };
      driver_documents: {
        Row: {
          id: string;
          driver_id: string;
          type: string;
          file_url: string;
          expiration_date: string | null;
          is_verified: boolean;
          verified_at: string | null;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          driver_id: string;
          type: string;
          file_url: string;
          expiration_date?: string | null;
          is_verified?: boolean;
          verified_at?: string | null;
          uploaded_at?: string;
        };
        Update: {
          file_url?: string;
          expiration_date?: string | null;
          is_verified?: boolean;
          verified_at?: string | null;
        };
      };
      driver_locations: {
        Row: {
          driver_id: string;
          location: unknown; // PostGIS POINT
          updated_at: string;
        };
        Insert: {
          driver_id: string;
          location: unknown;
          updated_at?: string;
        };
        Update: {
          location?: unknown;
          updated_at?: string;
        };
      };
      trips: {
        Row: {
          id: string;
          passenger_id: string;
          driver_id: string | null;
          origin_address: string;
          origin_lat: number;
          origin_lng: number;
          destination_address: string;
          destination_lat: number;
          destination_lng: number;
          status: string;
          requested_at: string;
          accepted_at: string | null;
          started_at: string | null;
          completed_at: string | null;
          cancelled_at: string | null;
          cancelled_by: string | null;
          cancellation_reason: string | null;
          price_base: number;
          price_distance: number;
          price_time: number;
          price_surge: number | null;
          price_discount: number | null;
          price_total: number;
          payment_method: 'credits' | 'cash';
          ride_mode: 'silent' | 'normal' | 'conversational';
          accessibility_needs: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          passenger_id: string;
          driver_id?: string | null;
          origin_address: string;
          origin_lat: number;
          origin_lng: number;
          destination_address: string;
          destination_lat: number;
          destination_lng: number;
          status?: string;
          requested_at?: string;
          accepted_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          cancellation_reason?: string | null;
          price_base: number;
          price_distance: number;
          price_time: number;
          price_surge?: number | null;
          price_discount?: number | null;
          price_total: number;
          payment_method: 'credits' | 'cash';
          ride_mode?: 'silent' | 'normal' | 'conversational';
          accessibility_needs?: string[];
        };
        Update: {
          driver_id?: string | null;
          status?: string;
          accepted_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          cancellation_reason?: string | null;
          updated_at?: string;
        };
      };
      community_routes: {
        Row: {
          id: string;
          driver_id: string;
          name: string;
          description: string | null;
          origin_address: string;
          origin_lat: number;
          origin_lng: number;
          destination_address: string;
          destination_lat: number;
          destination_lng: number;
          waypoints: Json;
          schedule: Json;
          price_per_seat: number;
          available_seats: number;
          total_seats: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          driver_id: string;
          name: string;
          description?: string | null;
          origin_address: string;
          origin_lat: number;
          origin_lng: number;
          destination_address: string;
          destination_lat: number;
          destination_lng: number;
          waypoints?: Json;
          schedule: Json;
          price_per_seat: number;
          available_seats: number;
          total_seats: number;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          description?: string | null;
          waypoints?: Json;
          schedule?: Json;
          price_per_seat?: number;
          available_seats?: number;
          total_seats?: number;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      route_reservations: {
        Row: {
          id: string;
          route_id: string;
          passenger_id: string;
          schedule_index: number;
          pickup_address: string;
          pickup_lat: number;
          pickup_lng: number;
          seats_reserved: number;
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          route_id: string;
          passenger_id: string;
          schedule_index: number;
          pickup_address: string;
          pickup_lat: number;
          pickup_lng: number;
          seats_reserved?: number;
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
        };
        Update: {
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
          updated_at?: string;
        };
      };
      traffic_reports: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          location_lat: number;
          location_lng: number;
          description: string | null;
          photos: string[];
          confirmations: number;
          denials: number;
          credibility_score: number;
          is_active: boolean;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          location_lat: number;
          location_lng: number;
          description?: string | null;
          photos?: string[];
          confirmations?: number;
          denials?: number;
          credibility_score?: number;
          is_active?: boolean;
          expires_at: string;
        };
        Update: {
          confirmations?: number;
          denials?: number;
          credibility_score?: number;
          is_active?: boolean;
        };
      };
      emergency_alerts: {
        Row: {
          id: string;
          user_id: string;
          trip_id: string | null;
          type: string;
          status: string;
          location_lat: number;
          location_lng: number;
          location_history: Json;
          escalation_level: number;
          responders_notified: string[];
          responders_confirmed: string[];
          resolution: Json | null;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          trip_id?: string | null;
          type: string;
          status?: string;
          location_lat: number;
          location_lng: number;
          location_history?: Json;
          escalation_level?: number;
          responders_notified?: string[];
          responders_confirmed?: string[];
          resolution?: Json | null;
        };
        Update: {
          status?: string;
          location_lat?: number;
          location_lng?: number;
          location_history?: Json;
          escalation_level?: number;
          responders_notified?: string[];
          responders_confirmed?: string[];
          resolution?: Json | null;
          resolved_at?: string | null;
        };
      };
      ratings: {
        Row: {
          id: string;
          trip_id: string;
          rater_id: string;
          rated_id: string;
          score: number;
          comment: string | null;
          tags: string[];
          rater_role: 'passenger' | 'driver';
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          rater_id: string;
          rated_id: string;
          score: number;
          comment?: string | null;
          tags?: string[];
          rater_role: 'passenger' | 'driver';
        };
        Update: never;
      };
      credit_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          type: 'topup' | 'trip_payment' | 'refund' | 'commission';
          description: string;
          payment_method: string | null;
          external_reference: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          type: 'topup' | 'trip_payment' | 'refund' | 'commission';
          description: string;
          payment_method?: string | null;
          external_reference?: string | null;
        };
        Update: never;
      };
      token_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          type: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          type: string;
          description: string;
        };
        Update: never;
      };
      penalties: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          severity: 'warning' | 'minor' | 'major' | 'suspension';
          description: string;
          tokens_deducted: number | null;
          suspension_until: string | null;
          created_at: string;
          appealed_at: string | null;
          appeal_status: 'pending' | 'accepted' | 'rejected' | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          severity: 'warning' | 'minor' | 'major' | 'suspension';
          description: string;
          tokens_deducted?: number | null;
          suspension_until?: string | null;
        };
        Update: {
          appealed_at?: string | null;
          appeal_status?: 'pending' | 'accepted' | 'rejected' | null;
        };
      };
    };
    Functions: {
      get_nearby_drivers: {
        Args: { lat: number; lng: number; radius_km: number };
        Returns: unknown[];
      };
      get_nearby_reports: {
        Args: { lat: number; lng: number; radius_km: number };
        Returns: unknown[];
      };
      get_nearby_alerts: {
        Args: { lat: number; lng: number; radius_m: number };
        Returns: unknown[];
      };
      update_user_credits: {
        Args: { user_id: string; amount: number };
        Returns: number;
      };
      update_user_tokens: {
        Args: { user_id: string; amount: number };
        Returns: number;
      };
      update_user_rating: {
        Args: { user_id: string };
        Returns: number;
      };
      confirm_report: {
        Args: { report_id: string; user_id: string };
        Returns: void;
      };
      deny_report: {
        Args: { report_id: string; user_id: string };
        Returns: void;
      };
      respond_to_alert: {
        Args: { alert_id: string; responder_id: string };
        Returns: void;
      };
      decrement_available_seats: {
        Args: { route_id: string; seats: number };
        Returns: void;
      };
    };
  };
}
