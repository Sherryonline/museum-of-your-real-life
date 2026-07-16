"use server";

import { createClient } from "@/lib/supabase/server";
import type { BadgeListItem, CollectionDetail, CollectionListItem } from "@/features/collections/types";

export async function getCollections(): Promise<CollectionListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_user_collections");

  if (error || !data) {
    return [];
  }

  return data.map((item) => ({
    collectionId: item.collection_id,
    code: item.code,
    name: item.name,
    description: item.description,
    categoryCode: item.category_code,
    categoryName: item.category_name,
    completionXp: item.completion_xp,
    badgeId: item.badge_id,
    badgeName: item.badge_name,
    displayOrder: item.display_order,
    ownedUniqueItems: item.owned_unique_items,
    requiredUniqueItems: item.required_unique_items,
    progressPercentage: Number(item.progress_percentage),
    completionStatus: item.completion_status,
    completedAt: item.completed_at,
    rewardGrantedAt: item.reward_granted_at,
  }));
}

export async function getCollectionDetail(collectionId: string): Promise<CollectionDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_collection_detail", {
    p_collection_id: collectionId,
  });

  if (error || !data?.[0]) {
    return null;
  }

  const first = data[0];

  return {
    collectionId: first.collection_id,
    name: first.collection_name,
    description: first.collection_description,
    categoryName: first.category_name,
    completionXp: first.completion_xp,
    badgeId: null,
    badgeName: first.badge_name,
    ownedUniqueItems: first.owned_unique_items,
    requiredUniqueItems: first.required_unique_items,
    progressPercentage: Number(first.progress_percentage),
    completionStatus: first.completion_status,
    completedAt: first.completed_at,
    items: data.map((item) => ({
      itemId: item.item_id,
      itemName: item.item_name,
      itemDescription: item.item_description,
      rarity: item.rarity,
      imageKey: item.image_key,
      owned: item.owned,
      quantity: item.quantity,
    })),
  };
}

export async function getBadges(): Promise<BadgeListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_user_badges");

  if (error || !data) {
    return [];
  }

  return data.map((badge) => ({
    badgeId: badge.badge_id,
    code: badge.code,
    name: badge.name,
    description: badge.description,
    iconKey: badge.icon_key,
    ruleType: badge.rule_type,
    ruleValue: badge.rule_value,
    earned: badge.earned,
    awardedAt: badge.awarded_at,
    progressHint: badge.progress_hint,
  }));
}
