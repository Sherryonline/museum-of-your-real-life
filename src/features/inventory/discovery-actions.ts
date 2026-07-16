"use server";

import { jsonArray } from "@/features/inventory/types";
import type {
  ArtifactBookItem,
  ArtifactBookListing,
  ArtifactTimelineItem,
  CategoryProgress,
  DiscoveryProgress,
  InventoryRecommendation,
  InventoryStatistics,
} from "@/features/inventory/discovery-types";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { ArtifactTimelineRpcRow, InventoryBookRpcRow } from "@/types/database";

function mapBook(row: InventoryBookRpcRow): ArtifactBookItem {
  return {
    itemId: row.item_id,
    categoryId: row.category_id,
    categoryCode: row.category_code,
    categoryName: row.category_name,
    artifactState: row.artifact_state,
    displayName: row.display_name,
    displayRarity: row.display_rarity,
    imageKey: row.image_key,
    discoveryDate: row.discovery_date,
    quantity: row.quantity,
    hintText: row.hint_text,
  };
}

export async function getArtifactBook(input: { categoryId?: string | null; page?: number }): Promise<ArtifactBookListing> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_inventory_book", {
    p_category_id: input.categoryId ?? null,
    p_page: input.page ?? 1,
  });

  if (error || !data) {
    return { items: [], page: input.page ?? 1, pageSize: 24, totalCount: 0, totalPages: 0 };
  }

  const first = data[0];
  const totalCount = first?.total_count ?? 0;
  const pageSize = first?.page_size ?? 24;

  return {
    items: data.map(mapBook),
    page: first?.page ?? input.page ?? 1,
    pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

export async function getDiscoveryProgress(): Promise<DiscoveryProgress> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_inventory_progress");
  const row = data?.[0];

  if (error || !row) {
    return { ownedUniqueItems: 0, totalItems: 0, discoveryPercentage: 0, categoryProgress: [] };
  }

  return {
    ownedUniqueItems: row.owned_unique_items,
    totalItems: row.total_items,
    discoveryPercentage: Number(row.discovery_percentage),
    categoryProgress: jsonArray<CategoryProgress>(row.category_progress),
  };
}

export async function getInventoryStatistics(): Promise<InventoryStatistics> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_inventory_statistics");
  const row = data?.[0];

  if (error || !row) {
    return {
      totalArtifacts: 0,
      uniqueArtifacts: 0,
      duplicateArtifacts: 0,
      discoveryPercentage: 0,
      favoriteCategory: null,
      mostCollectedArtifact: null,
      oldestArtifact: null,
      newestArtifact: null,
    };
  }

  return {
    totalArtifacts: row.total_artifacts,
    uniqueArtifacts: row.unique_artifacts,
    duplicateArtifacts: row.duplicate_artifacts,
    discoveryPercentage: Number(row.discovery_percentage),
    favoriteCategory: row.favorite_category,
    mostCollectedArtifact: row.most_collected_artifact,
    oldestArtifact: row.oldest_artifact,
    newestArtifact: row.newest_artifact,
  };
}

export async function getInventoryRecommendations(): Promise<InventoryRecommendation[]> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_inventory_recommendations");

  if (error || !data) return [];

  return data.map((row) => ({
    recommendationType: row.recommendation_type,
    categoryId: row.category_id,
    categoryName: row.category_name,
    ownedUniqueItems: row.owned_unique_items,
    totalItems: row.total_items,
    remainingItems: row.remaining_items,
    message: row.message,
  }));
}

export async function getArtifactTimeline(itemId: string): Promise<ArtifactTimelineItem[]> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_artifact_timeline", { p_item_id: itemId });

  if (error || !data) return [];

  return data.map((row: ArtifactTimelineRpcRow) => ({
    locationName: row.location_name,
    visitDate: row.visit_date,
    memoryTitle: row.memory_title,
    checkInId: row.check_in_id,
  }));
}
