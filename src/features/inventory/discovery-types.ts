import type { ItemRarity } from "@/types/database";

export type ArtifactBookItem = {
  itemId: string;
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  artifactState: "COLLECTED" | "UNKNOWN" | "HIDDEN";
  displayName: string;
  displayRarity: ItemRarity | null;
  imageKey: string | null;
  discoveryDate: string | null;
  quantity: number;
  hintText: string | null;
};

export type ArtifactBookListing = {
  items: ArtifactBookItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type DiscoveryProgress = {
  ownedUniqueItems: number;
  totalItems: number;
  discoveryPercentage: number;
  categoryProgress: CategoryProgress[];
};

export type CategoryProgress = {
  category_id: string;
  category_code: string;
  category_name: string;
  owned_unique_items: number;
  total_items: number;
  discovery_percentage: number;
};

export type InventoryStatistics = {
  totalArtifacts: number;
  uniqueArtifacts: number;
  duplicateArtifacts: number;
  discoveryPercentage: number;
  favoriteCategory: string | null;
  mostCollectedArtifact: string | null;
  oldestArtifact: string | null;
  newestArtifact: string | null;
};

export type InventoryRecommendation = {
  recommendationType: "LOWEST_COMPLETION" | "CLOSEST_TO_COMPLETION";
  categoryId: string;
  categoryName: string;
  ownedUniqueItems: number;
  totalItems: number;
  remainingItems: number;
  message: string;
};

export type ArtifactTimelineItem = {
  locationName: string;
  visitDate: string;
  memoryTitle: string | null;
  checkInId: string;
};
