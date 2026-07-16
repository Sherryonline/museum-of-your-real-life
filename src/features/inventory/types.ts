import type { ItemRarity, Json } from "@/types/database";

export type InventoryDashboard = {
  totalItems: number;
  ownedUniqueItems: number;
  totalQuantity: number;
  discoveryPercentage: number;
  totalXp: number;
  favoriteCount: number;
  recentArtifacts: InventoryArtifactCard[];
  categoryProgress: CategoryProgress[];
  rarityCounts: RarityCount[];
};

export type InventoryArtifactCard = {
  itemId: string;
  categoryId: string | null;
  categoryCode: string | null;
  categoryName: string;
  rarity: ItemRarity;
  owned: boolean;
  quantity: number;
  firstFoundAt: string | null;
  lastFoundAt: string | null;
  isFavorite: boolean;
  displayName: string;
  description: string | null;
  imageKey: string | null;
  hintText: string | null;
};

export type InventoryListing = {
  items: InventoryArtifactCard[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type ArtifactDetail = InventoryArtifactCard & {
  xpEarned: number;
};

export type CategoryProgress = {
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  ownedUniqueItems: number;
  totalItems: number;
  discoveryPercentage: number;
};

export type RarityCount = {
  rarity: ItemRarity;
  ownedUniqueItems: number;
  totalItems: number;
};

export type FavoriteResult = {
  ok: boolean;
  message: string;
  itemId: string;
  isFavorite: boolean;
  favoriteCount: number;
  errorCode: string | null;
};

export function jsonArray<T>(value: Json): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}
