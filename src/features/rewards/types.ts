import type { ItemRarity, RewardStatus } from "@/types/database";

export type RewardResult = {
  rewardTransactionId: string | null;
  checkInId: string | null;
  itemId: string | null;
  itemCode: string | null;
  itemName: string | null;
  itemDescription: string | null;
  rarity: ItemRarity | null;
  imageKey: string | null;
  xpAwarded: number;
  duplicate: boolean;
  inventoryQuantity: number;
  totalXp: number;
  level: number;
  levelTitle: string;
  rewardStatus: RewardStatus;
  errorCode: string | null;
  message: string;
};

export type InventoryItem = {
  inventoryId: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  itemDescription: string;
  rarity: ItemRarity;
  imageKey: string;
  categoryCode: string;
  categoryName: string;
  quantity: number;
  firstCollectedAt: string;
  lastCollectedAt: string;
};

export type InventorySummary = {
  items: InventoryItem[];
  totalXp: number;
  level: number;
  levelTitle: string;
};
