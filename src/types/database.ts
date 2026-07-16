export type UserRole = "PLAYER" | "ADMIN";
export type ProfileStatus = "ACTIVE" | "SUSPENDED";
export type MuseumVisibility = "PRIVATE" | "PUBLIC";
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Profile = {
  id: string;
  display_name: string;
  avatar_key: string;
  status: ProfileStatus;
  museum_visibility: MuseumVisibility;
  created_at: string;
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
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: never; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
