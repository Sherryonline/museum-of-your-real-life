import type { CategoryProgress, InventoryRecommendation, InventoryStatistics } from "@/features/inventory/discovery-types";

export function discoveryPercentage(owned: number, total: number) {
  if (total <= 0) return 0;
  return Number(((owned / total) * 100).toFixed(2));
}

export function categoryProgress(owned: number, total: number) {
  return {
    ownedUniqueItems: owned,
    totalItems: total,
    discoveryPercentage: discoveryPercentage(owned, total),
  };
}

export function deterministicRecommendations(categories: CategoryProgress[]): InventoryRecommendation[] {
  const candidates = categories.filter((category) => category.total_items > 0);
  const lowest = [...candidates].sort(
    (a, b) =>
      a.owned_unique_items / a.total_items - b.owned_unique_items / b.total_items ||
      a.category_name.localeCompare(b.category_name),
  )[0];
  const closest = [...candidates]
    .filter((category) => category.owned_unique_items < category.total_items)
    .sort(
      (a, b) =>
        a.total_items - a.owned_unique_items - (b.total_items - b.owned_unique_items) ||
        a.category_name.localeCompare(b.category_name),
    )[0];

  return [lowest, closest].flatMap((category, index) => {
    if (!category) return [];

    return {
      recommendationType: index === 0 ? "LOWEST_COMPLETION" : "CLOSEST_TO_COMPLETION",
      categoryId: category.category_id,
      categoryName: category.category_name,
      ownedUniqueItems: category.owned_unique_items,
      totalItems: category.total_items,
      remainingItems: category.total_items - category.owned_unique_items,
      message:
        index === 0
          ? `Explore ${category.category_name}: ${category.owned_unique_items} / ${category.total_items} artifacts discovered.`
          : `Only ${category.total_items - category.owned_unique_items} artifacts remaining in ${category.category_name}.`,
    };
  });
}

export function inventoryStatistics(input: {
  totalArtifacts: number;
  uniqueArtifacts: number;
  discoverCounts: number[];
}): Pick<InventoryStatistics, "duplicateArtifacts" | "discoveryPercentage"> {
  return {
    duplicateArtifacts: input.discoverCounts.reduce((sum, count) => sum + Math.max(count - 1, 0), 0),
    discoveryPercentage: discoveryPercentage(input.uniqueArtifacts, input.totalArtifacts),
  };
}

export function newestFirstTimeline<T extends { visitDate: string }>(items: T[]) {
  return [...items].sort((a, b) => Date.parse(b.visitDate) - Date.parse(a.visitDate)).slice(0, 20);
}
