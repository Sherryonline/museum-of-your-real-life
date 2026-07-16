import type { BadgeRuleType, CollectionCompletionStatus, ItemRarity, Json } from "@/types/database";

export type CollectionListItem = {
  collectionId: string;
  code: string;
  name: string;
  description: string;
  categoryCode: string;
  categoryName: string;
  completionXp: number;
  badgeId: string | null;
  badgeName: string | null;
  displayOrder: number;
  ownedUniqueItems: number;
  requiredUniqueItems: number;
  progressPercentage: number;
  completionStatus: CollectionCompletionStatus;
  completedAt: string | null;
  rewardGrantedAt: string | null;
};

export type CollectionDetail = Omit<CollectionListItem, "code" | "categoryCode" | "displayOrder" | "rewardGrantedAt"> & {
  items: Array<{
    itemId: string;
    itemName: string;
    itemDescription: string;
    rarity: ItemRarity;
    imageKey: string;
    owned: boolean;
    quantity: number;
  }>;
};

export type BadgeListItem = {
  badgeId: string;
  code: string;
  name: string;
  description: string;
  iconKey: string;
  ruleType: BadgeRuleType;
  ruleValue: Json;
  earned: boolean;
  awardedAt: string | null;
  progressHint: string;
};
