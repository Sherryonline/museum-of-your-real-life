export type UserRole = "PLAYER" | "ADMIN";
export type ProfileStatus = "ACTIVE" | "SUSPENDED";
export type MuseumVisibility = "PRIVATE" | "PUBLIC";
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type LocationStatus = "ACTIVE" | "INACTIVE";
export type LootTableStatus = "DRAFT" | "ACTIVE" | "INACTIVE";
export type CheckInValidationStatus = "VALID" | "REJECTED" | "SUSPICIOUS";
export type RewardStatus = "NOT_APPLICABLE" | "PENDING" | "GRANTED" | "BLOCKED";
export type MemoryVisibility = "PRIVATE" | "PUBLIC";
export type ItemRarity = "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY";

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

export type Item = {
  id: string;
  code: string;
  category_id: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  image_key: string;
  base_xp: number;
  status: LocationStatus;
  created_at: string;
  updated_at: string;
};

export type LootTable = {
  id: string;
  code: string;
  category_id: string;
  name: string;
  version: number;
  effective_from: string;
  effective_to: string | null;
  status: LootTableStatus;
  created_at: string;
};

export type LootTableItem = {
  id: string;
  loot_table_id: string;
  item_id: string;
  weight: number;
  status: LocationStatus;
};

export type RewardTransaction = {
  id: string;
  user_id: string;
  check_in_id: string;
  loot_table_id: string;
  loot_table_version: number;
  item_id: string;
  rarity: ItemRarity;
  item_quantity: number;
  xp_awarded: number;
  created_at: string;
};

export type UserInventory = {
  id: string;
  user_id: string;
  item_id: string;
  quantity: number;
  first_collected_at: string;
  last_collected_at: string;
};

export type XpTransaction = {
  id: string;
  user_id: string;
  source_type: "CHECK_IN_REWARD" | "DUPLICATE_ITEM" | "COLLECTION_COMPLETION";
  source_id: string;
  amount: number;
  description: string;
  created_at: string;
};

export type LevelConfiguration = {
  level: number;
  required_total_xp: number;
  title: string;
  status: LocationStatus;
};

export type RewardRpcRow = {
  reward_transaction_id: string | null;
  check_in_id: string | null;
  item_id: string | null;
  item_code: string | null;
  item_name: string | null;
  item_description: string | null;
  rarity: ItemRarity | null;
  image_key: string | null;
  xp_awarded: number;
  duplicate: boolean;
  inventory_quantity: number;
  total_xp: number;
  level: number;
  level_title: string;
  reward_status: RewardStatus;
  error_code: string | null;
  user_message: string;
};

export type InventoryRpcRow = {
  inventory_id: string;
  item_id: string;
  item_code: string;
  item_name: string;
  item_description: string;
  rarity: ItemRarity;
  image_key: string;
  category_code: string;
  category_name: string;
  quantity: number;
  first_collected_at: string;
  last_collected_at: string;
  total_xp: number;
  level: number;
  level_title: string;
};

export type BadgeRuleType =
  | "FIRST_MEMORY"
  | "FIRST_CATEGORY_CHECKIN"
  | "TOTAL_VALID_CHECKINS"
  | "UNIQUE_LOCATIONS"
  | "UNIQUE_CATEGORIES"
  | "COLLECTION_COMPLETED"
  | "WEEKEND_CHECKINS";

export type CollectionCompletionStatus = "IN_PROGRESS" | "COMPLETED";

export type Badge = {
  id: string;
  code: string;
  name: string;
  description: string;
  icon_key: string;
  rule_type: BadgeRuleType;
  rule_value: Json;
  status: LocationStatus;
};

export type Collection = {
  id: string;
  code: string;
  category_id: string;
  name: string;
  description: string;
  completion_xp: number;
  badge_id: string | null;
  display_order: number;
  status: LocationStatus;
  created_at: string;
  updated_at: string;
};

export type CollectionItem = {
  collection_id: string;
  item_id: string;
  display_order: number;
};

export type UserCollectionProgress = {
  id: string;
  user_id: string;
  collection_id: string;
  owned_unique_items: number;
  required_unique_items: number;
  progress_percentage: number;
  completion_status: CollectionCompletionStatus;
  completed_at: string | null;
  reward_granted_at: string | null;
};

export type UserBadge = {
  id: string;
  user_id: string;
  badge_id: string;
  source_type: BadgeRuleType;
  source_id: string | null;
  awarded_at: string;
};

export type BetaFeedbackStatus = "OPEN" | "REVIEWED" | "RESOLVED" | "CLOSED";
export type BetaFeedbackCategory = "BUG" | "IDEA" | "CONFUSING" | "PRAISE" | "OTHER";

export type BetaFeedback = {
  id: string;
  user_id: string;
  rating: number;
  category: BetaFeedbackCategory;
  message: string;
  screenshot_url: string | null;
  status: BetaFeedbackStatus;
  created_at: string;
  updated_at: string;
};

export type CollectionRpcRow = {
  collection_id: string;
  code: string;
  name: string;
  description: string;
  category_code: string;
  category_name: string;
  completion_xp: number;
  badge_id: string | null;
  badge_name: string | null;
  display_order: number;
  owned_unique_items: number;
  required_unique_items: number;
  progress_percentage: number;
  completion_status: CollectionCompletionStatus;
  completed_at: string | null;
  reward_granted_at: string | null;
};

export type CollectionDetailRpcRow = {
  collection_id: string;
  collection_name: string;
  collection_description: string;
  category_name: string;
  completion_xp: number;
  badge_name: string | null;
  owned_unique_items: number;
  required_unique_items: number;
  progress_percentage: number;
  completion_status: CollectionCompletionStatus;
  completed_at: string | null;
  item_id: string;
  item_name: string;
  item_description: string;
  rarity: ItemRarity;
  image_key: string;
  owned: boolean;
  quantity: number;
};

export type BadgeRpcRow = {
  badge_id: string;
  code: string;
  name: string;
  description: string;
  icon_key: string;
  rule_type: BadgeRuleType;
  rule_value: Json;
  earned: boolean;
  awarded_at: string | null;
  progress_hint: string;
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
        Update: {
          validation_status?: CheckInValidationStatus;
          suspicious_flag?: boolean;
          suspicious_reason?: string | null;
          reward_status?: RewardStatus;
        };
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
      items: {
        Row: Item;
        Insert: {
          id?: string;
          code: string;
          category_id: string;
          name: string;
          description: string;
          rarity: ItemRarity;
          image_key: string;
          base_xp: number;
          status?: LocationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Item, "id" | "created_at">>;
        Relationships: [];
      };
      loot_tables: {
        Row: LootTable;
        Insert: {
          id?: string;
          code: string;
          category_id: string;
          name: string;
          version: number;
          effective_from?: string;
          effective_to?: string | null;
          status?: LootTableStatus;
          created_at?: string;
        };
        Update: Partial<Omit<LootTable, "id" | "created_at">>;
        Relationships: [];
      };
      loot_table_items: {
        Row: LootTableItem;
        Insert: {
          id?: string;
          loot_table_id: string;
          item_id: string;
          weight: number;
          status?: LocationStatus;
        };
        Update: Partial<Omit<LootTableItem, "id">>;
        Relationships: [];
      };
      reward_transactions: {
        Row: RewardTransaction;
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      user_inventory: {
        Row: UserInventory;
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      xp_transactions: {
        Row: XpTransaction;
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      level_configurations: {
        Row: LevelConfiguration;
        Insert: {
          level: number;
          required_total_xp: number;
          title: string;
          status?: LocationStatus;
        };
        Update: Partial<Omit<LevelConfiguration, "level">>;
        Relationships: [];
      };
      badges: {
        Row: Badge;
        Insert: {
          id?: string;
          code: string;
          name: string;
          description: string;
          icon_key: string;
          rule_type: BadgeRuleType;
          rule_value?: Json;
          status?: LocationStatus;
        };
        Update: Partial<Omit<Badge, "id">>;
        Relationships: [];
      };
      collections: {
        Row: Collection;
        Insert: {
          id?: string;
          code: string;
          category_id: string;
          name: string;
          description: string;
          completion_xp: number;
          badge_id?: string | null;
          display_order?: number;
          status?: LocationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Collection, "id" | "created_at">>;
        Relationships: [];
      };
      collection_items: {
        Row: CollectionItem;
        Insert: CollectionItem;
        Update: Partial<CollectionItem>;
        Relationships: [];
      };
      user_collection_progress: {
        Row: UserCollectionProgress;
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      user_badges: {
        Row: UserBadge;
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      beta_feedback: {
        Row: BetaFeedback;
        Insert: {
          id?: string;
          user_id: string;
          rating: number;
          category: BetaFeedbackCategory;
          message: string;
          screenshot_url?: string | null;
          status?: BetaFeedbackStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: BetaFeedbackStatus;
        };
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
      open_check_in_reward: {
        Args: { p_check_in_id: string };
        Returns: RewardRpcRow[];
      };
      get_check_in_reward: {
        Args: { p_check_in_id: string };
        Returns: RewardRpcRow[];
      };
      get_user_inventory: {
        Args: never;
        Returns: InventoryRpcRow[];
      };
      get_user_collections: {
        Args: never;
        Returns: CollectionRpcRow[];
      };
      get_collection_detail: {
        Args: { p_collection_id: string };
        Returns: CollectionDetailRpcRow[];
      };
      get_user_badges: {
        Args: never;
        Returns: BadgeRpcRow[];
      };
      record_admin_audit: {
        Args: {
          p_action: string;
          p_entity_type: string;
          p_entity_id?: string | null;
          p_metadata?: Json;
        };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
