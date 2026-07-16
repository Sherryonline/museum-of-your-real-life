import type { BadgeRuleType, CollectionCompletionStatus } from "@/types/database";

export function calculateCollectionProgress(ownedUniqueItems: number, requiredUniqueItems: number) {
  if (requiredUniqueItems <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((ownedUniqueItems / requiredUniqueItems) * 10_000) / 100);
}

export function getCollectionCompletionStatus(progressPercentage: number): CollectionCompletionStatus {
  return progressPercentage >= 100 ? "COMPLETED" : "IN_PROGRESS";
}

export function isWeekend(date: Date) {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

export function getBadgeRuleLabel(ruleType: BadgeRuleType) {
  const labels: Record<BadgeRuleType, string> = {
    FIRST_MEMORY: "First memory",
    FIRST_CATEGORY_CHECKIN: "First category check-in",
    TOTAL_VALID_CHECKINS: "Valid check-ins",
    UNIQUE_LOCATIONS: "Unique locations",
    UNIQUE_CATEGORIES: "Unique categories",
    COLLECTION_COMPLETED: "Collection completed",
    WEEKEND_CHECKINS: "Weekend check-ins",
  };

  return labels[ruleType];
}
