"use server";

import { createClient } from "@/lib/supabase/server";
import type { InventorySummary, RewardResult } from "@/features/rewards/types";
import type { InventoryRpcRow, RewardRpcRow } from "@/types/database";

function mapReward(row: RewardRpcRow): RewardResult {
  return {
    rewardTransactionId: row.reward_transaction_id,
    checkInId: row.check_in_id,
    itemId: row.item_id,
    itemCode: row.item_code,
    itemName: row.item_name,
    itemDescription: row.item_description,
    rarity: row.rarity,
    imageKey: row.image_key,
    xpAwarded: row.xp_awarded,
    duplicate: row.duplicate,
    inventoryQuantity: row.inventory_quantity,
    totalXp: row.total_xp,
    level: row.level,
    levelTitle: row.level_title,
    rewardStatus: row.reward_status,
    errorCode: row.error_code,
    message: row.user_message,
  };
}

export async function getRewardForCheckIn(checkInId: string): Promise<RewardResult | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_check_in_reward", { p_check_in_id: checkInId });

  if (error || !data?.[0]) {
    return null;
  }

  return mapReward(data[0]);
}

export async function openRewardForCheckIn(checkInId: string): Promise<RewardResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("open_check_in_reward", { p_check_in_id: checkInId });

  if (error || !data?.[0]) {
    return {
      rewardTransactionId: null,
      checkInId,
      itemId: null,
      itemCode: null,
      itemName: null,
      itemDescription: null,
      rarity: null,
      imageKey: null,
      xpAwarded: 0,
      duplicate: false,
      inventoryQuantity: 0,
      totalXp: 0,
      level: 1,
      levelTitle: "Visitor",
      rewardStatus: "NOT_APPLICABLE",
      errorCode: "REWARD_INTERNAL_ERROR",
      message: "Reward could not be opened. Try again later.",
    };
  }

  return mapReward(data[0]);
}

function mapInventory(row: InventoryRpcRow) {
  return {
    inventoryId: row.inventory_id,
    itemId: row.item_id,
    itemCode: row.item_code,
    itemName: row.item_name,
    itemDescription: row.item_description,
    rarity: row.rarity,
    imageKey: row.image_key,
    categoryCode: row.category_code,
    categoryName: row.category_name,
    quantity: row.quantity,
    firstCollectedAt: row.first_collected_at,
    lastCollectedAt: row.last_collected_at,
  };
}

export async function getInventory(): Promise<InventorySummary> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_user_inventory");

  if (error || !data) {
    return { items: [], totalXp: 0, level: 1, levelTitle: "Visitor" };
  }

  const first = data[0];

  return {
    items: data.map(mapInventory),
    totalXp: first?.total_xp ?? 0,
    level: first?.level ?? 1,
    levelTitle: first?.level_title ?? "Visitor",
  };
}
