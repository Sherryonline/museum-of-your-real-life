export type UserRole = "PLAYER" | "ADMIN";
export type ProfileStatus = "ACTIVE" | "SUSPENDED";
export type MuseumVisibility = "PRIVATE" | "PUBLIC";
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type LocationStatus = "ACTIVE" | "INACTIVE";
export type CheckInValidationStatus = "VALID" | "REJECTED" | "SUSPICIOUS";
export type RewardStatus = "NOT_APPLICABLE" | "PENDING" | "BLOCKED";
export type MemoryVisibility = "PRIVATE" | "PUBLIC";

export type Profile = {
  id: string;
  display_name: string;
  avatar_key: string;
  status: ProfileStatus;
  museum_visibility: MuseumVisibility;
  created_at: string;
  updated_at: string;
};

export type LocationCategory = {
  id: string;
  code: string;
  name: string;
  icon: string;
  chest_name: string;
  status: LocationStatus;
  created_at: string;
  updated_at: string;
};

export type Location = {
  id: string;
  code: string;
  name: string;
  brand_name: string | null;
  category_id: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  district: string;
  check_in_radius_m: number;
  status: LocationStatus;
  partner_flag: boolean;
  created_at: string;
  updated_at: string;
};

export type CheckIn = {
  id: string;
  user_id: string;
  location_id: string;
  idempotency_key: string;
  user_latitude: number;
  user_longitude: number;
  gps_accuracy_m: number;
  calculated_distance_m: number;
  client_timestamp: string;
  server_timestamp: string;
  validation_status: CheckInValidationStatus;
  suspicious_flag: boolean;
  suspicious_reason: string | null;
  reward_status: RewardStatus;
  created_at: string;
};

export type Memory = {
  id: string;
  user_id: string;
  check_in_id: string;
  location_id: string;
  category_id: string;
  title: string;
  note: string | null;
  photo_url: string | null;
  visibility: MemoryVisibility;
  visited_at: string;
  created_at: string;
  updated_at: string;
};

export type AppConfiguration = {
  id: string;
  config_key: string;
  config_value: Json;
  description: string;
  status: LocationStatus;
  updated_at: string;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          display_name: string;
          avatar_key?: string;
          status?: ProfileStatus;
          museum_visibility?: MuseumVisibility;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string;
          avatar_key?: string;
          museum_visibility?: MuseumVisibility;
        };
        Relationships: [];
      };
      user_roles: {
        Row: { id: string; user_id: string; role: UserRole; created_at: string };
        Insert: { id?: string; user_id: string; role: UserRole; created_at?: string };
        Update: Record<string, never>;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      location_categories: {
        Row: LocationCategory;
        Insert: {
          id?: string;
          code: string;
          name: string;
          icon: string;
          chest_name: string;
          status?: LocationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<LocationCategory, "id" | "created_at">>;
        Relationships: [];
      };
      locations: {
        Row: Location;
        Insert: {
          id?: string;
          code: string;
          name: string;
          brand_name?: string | null;
          category_id: string;
          latitude: number;
          longitude: number;
          address: string;
          city: string;
          district: string;
          check_in_radius_m?: number;
          status?: LocationStatus;
          partner_flag?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Location, "id" | "created_at">>;
        Relationships: [];
      };
      check_ins: {
        Row: CheckIn;
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      memories: {
        Row: Memory;
        Insert: Record<string, never>;
        Update: {
          note?: string | null;
          photo_url?: string | null;
          visibility?: MemoryVisibility;
        };
        Relationships: [];
      };
      app_configurations: {
        Row: AppConfiguration;
        Insert: {
          id?: string;
          config_key: string;
          config_value: Json;
          description: string;
          status?: LocationStatus;
          updated_at?: string;
        };
        Update: Partial<Omit<AppConfiguration, "id">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: never; Returns: boolean };
      get_nearby_locations: {
        Args: { p_latitude: number; p_longitude: number; p_radius_m?: number | null };
        Returns: Array<{
          location_id: string;
          name: string;
          brand_name: string | null;
          category_code: string;
          category_name: string;
          category_icon: string;
          distance_m: number;
          check_in_radius_m: number;
          address: string;
          city: string;
          district: string;
          eligible: boolean;
        }>;
      };
      process_check_in: {
        Args: {
          p_location_id: string;
          p_latitude: number;
          p_longitude: number;
          p_accuracy_m: number;
          p_client_timestamp: string;
          p_idempotency_key: string;
        };
        Returns: Array<{
          check_in_id: string | null;
          memory_id: string | null;
          validation_status: CheckInValidationStatus;
          reward_status: RewardStatus;
          suspicious_flag: boolean;
          error_code: string | null;
          user_message: string;
          retry_after_seconds: number | null;
        }>;
      };
      get_check_in_history: {
        Args: never;
        Returns: Array<{
          check_in_id: string;
          validation_status: CheckInValidationStatus;
          reward_status: RewardStatus;
          suspicious_flag: boolean;
          server_timestamp: string;
          calculated_distance_m: number;
          location_name: string;
          category_name: string;
          category_icon: string;
          memory_id: string | null;
        }>;
      };
      get_check_in_detail: {
        Args: { p_check_in_id: string };
        Returns: Array<{
          check_in_id: string;
          validation_status: CheckInValidationStatus;
          reward_status: RewardStatus;
          suspicious_flag: boolean;
          server_timestamp: string;
          calculated_distance_m: number;
          location_name: string;
          location_address: string;
          category_name: string;
          category_icon: string;
          memory_id: string | null;
          memory_title: string | null;
          memory_note: string | null;
          memory_visibility: MemoryVisibility | null;
        }>;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
