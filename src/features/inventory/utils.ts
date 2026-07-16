import type { InventoryArtifactCard } from "@/features/inventory/types";
import type { ItemRarity } from "@/types/database";

const rarityRank: Record<ItemRarity, number> = {
  COMMON: 1,
  UNCOMMON: 2,
  RARE: 3,
  EPIC: 4,
  LEGENDARY: 5,
};

export function calculateDiscoveryPercentage(ownedUniqueItems: number, totalItems: number) {
  if (totalItems <= 0) return 0;
  return Number(((ownedUniqueItems / totalItems) * 100).toFixed(2));
}

export function filterInventoryItems(
  items: InventoryArtifactCard[],
  filters: {
    search?: string;
    categoryId?: string | null;
    rarity?: ItemRarity | null;
    ownership?: "OWNED" | "UNOWNED" | "ALL" | "FAVORITES";
  },
) {
  const search = filters.search?.trim().toLowerCase();

  return items.filter((item) => {
    const matchesSearch =
      !search ||
      (item.owned &&
        [item.displayName, item.description, item.categoryName].some((value) =>
          value?.toLowerCase().includes(search),
        ));
    const matchesCategory = !filters.categoryId || item.categoryId === filters.categoryId;
    const matchesRarity = !filters.rarity || item.rarity === filters.rarity;
    const matchesOwnership =
      !filters.ownership ||
      filters.ownership === "ALL" ||
      (filters.ownership === "OWNED" && item.owned) ||
      (filters.ownership === "UNOWNED" && !item.owned) ||
      (filters.ownership === "FAVORITES" && item.isFavorite);

    return matchesSearch && matchesCategory && matchesRarity && matchesOwnership;
  });
}

export function sortInventoryItems(
  items: InventoryArtifactCard[],
  sort: "RECENT" | "FIRST_FOUND" | "NAME_ASC" | "RARITY_DESC" | "QUANTITY_DESC",
) {
  return [...items].sort((a, b) => {
    if (sort === "RECENT") {
      return Date.parse(b.lastFoundAt ?? "0") - Date.parse(a.lastFoundAt ?? "0");
    }

    if (sort === "FIRST_FOUND") {
      return Date.parse(a.firstFoundAt ?? "9999-12-31") - Date.parse(b.firstFoundAt ?? "9999-12-31");
    }

    if (sort === "NAME_ASC") {
      return a.displayName.localeCompare(b.displayName);
    }

    if (sort === "RARITY_DESC") {
      return rarityRank[b.rarity] - rarityRank[a.rarity];
    }

    return b.quantity - a.quantity;
  });
}
