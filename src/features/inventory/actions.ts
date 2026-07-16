"use server";

import { revalidatePath } from "next/cache";

import { inventoryQuerySchema } from "@/features/inventory/schemas";
import type {
  ArtifactDetail,
  CategoryProgress,
  FavoriteResult,
  InventoryArtifactCard,
  InventoryDashboard,
  InventoryListing,
  RarityCount,
} from "@/features/inventory/types";
import { jsonArray } from "@/features/inventory/types";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { ArtifactDetailRpcRow, InventoryListingRpcRow, ItemRarity } from "@/types/database";

type RecentArtifactJson = {
  item_id: string;
  name: string;
  rarity: ItemRarity;
  image_key: string;
  category_name: string;
  quantity: number;
  first_found_at: string;
  last_found_at: string;
  is_favorite: boolean;
};

function mapListingRow(row: InventoryListingRpcRow): InventoryArtifactCard {
  return {
    itemId: row.item_id,
    categoryId: row.category_id,
    categoryCode: row.category_code,
    categoryName: row.category_name,
    rarity: row.rarity,
    owned: row.owned,
    quantity: row.quantity,
    firstFoundAt: row.first_found_at,
    lastFoundAt: row.last_found_at,
    isFavorite: row.is_favorite,
    displayName: row.display_name,
    description: row.description,
    imageKey: row.image_key,
    hintText: row.hint_text,
  };
}

function mapDetailRow(row: ArtifactDetailRpcRow): ArtifactDetail {
  return {
    ...mapListingRow({ ...row, total_count: 1, page: 1, page_size: 20 }),
    xpEarned: row.xp_earned,
  };
}

export async function getInventoryDashboard(): Promise<InventoryDashboard> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_inventory_dashboard");
  const row = data?.[0];

  if (error || !row) {
    return {
      totalItems: 0,
      ownedUniqueItems: 0,
      totalQuantity: 0,
      discoveryPercentage: 0,
      totalXp: 0,
      favoriteCount: 0,
      recentArtifacts: [],
      categoryProgress: [],
      rarityCounts: [],
    };
  }

  return {
    totalItems: row.total_items,
    ownedUniqueItems: row.owned_unique_items,
    totalQuantity: row.total_quantity,
    discoveryPercentage: Number(row.discovery_percentage),
    totalXp: row.total_xp,
    favoriteCount: row.favorite_count,
    recentArtifacts: jsonArray<RecentArtifactJson>(row.recent_artifacts).map((item) => ({
      itemId: item.item_id,
      categoryId: null,
      categoryCode: null,
      categoryName: item.category_name,
      rarity: item.rarity,
      owned: true,
      quantity: item.quantity,
      firstFoundAt: item.first_found_at,
      lastFoundAt: item.last_found_at,
      isFavorite: item.is_favorite,
      displayName: item.name,
      description: null,
      imageKey: item.image_key,
      hintText: null,
    })),
    categoryProgress: jsonArray<CategoryProgress>(row.category_progress),
    rarityCounts: jsonArray<RarityCount>(row.rarity_counts),
  };
}

export async function getInventoryListing(input: unknown): Promise<InventoryListing> {
  await requireUser();
  const parsed = inventoryQuerySchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_inventory_listing", {
    p_search: parsed.q || null,
    p_category_id: parsed.category || null,
    p_rarity: parsed.rarity || null,
    p_ownership: parsed.ownership,
    p_sort: parsed.sort,
    p_page: parsed.page,
  });

  if (error || !data) {
    return { items: [], page: parsed.page, pageSize: 20, totalCount: 0, totalPages: 0 };
  }

  const first = data[0];
  const totalCount = first?.total_count ?? 0;
  const pageSize = first?.page_size ?? 20;

  return {
    items: data.map(mapListingRow),
    page: first?.page ?? parsed.page,
    pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

export async function getArtifactDetail(itemId: string): Promise<ArtifactDetail | null> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_artifact_detail", { p_item_id: itemId });

  if (error || !data?.[0]) {
    return null;
  }

  return mapDetailRow(data[0]);
}

export async function setFavoriteArtifactAction(formData: FormData): Promise<FavoriteResult> {
  await requireUser();
  const itemId = String(formData.get("itemId") ?? "");
  const favorite = formData.get("favorite") === "true";
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_item_favorite", {
    p_item_id: itemId,
    p_favorite: favorite,
  });
  const row = data?.[0];

  if (error || !row || row.error_code) {
    return {
      ok: false,
      message: row?.user_message ?? "Favorite could not be updated.",
      itemId,
      isFavorite: row?.is_favorite ?? false,
      favoriteCount: row?.favorite_count ?? 0,
      errorCode: row?.error_code ?? "FAVORITE_UPDATE_FAILED",
    };
  }

  revalidatePath("/app/inventory");
  revalidatePath(`/app/inventory/${itemId}`);

  return {
    ok: true,
    message: row.user_message,
    itemId: row.item_id,
    isFavorite: row.is_favorite,
    favoriteCount: row.favorite_count,
    errorCode: null,
  };
}
