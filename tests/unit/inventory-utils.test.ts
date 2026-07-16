import { describe, expect, it } from "vitest";

import {
  calculateDiscoveryPercentage,
  filterInventoryItems,
  sortInventoryItems,
} from "@/features/inventory/utils";
import type { InventoryArtifactCard } from "@/features/inventory/types";

const items: InventoryArtifactCard[] = [
  {
    itemId: "1",
    categoryId: "coffee",
    categoryCode: "COFFEE",
    categoryName: "Coffee",
    rarity: "COMMON",
    owned: true,
    quantity: 3,
    firstFoundAt: "2026-01-01T00:00:00Z",
    lastFoundAt: "2026-01-03T00:00:00Z",
    isFavorite: true,
    displayName: "Coffee Cup",
    description: "A warm artifact",
    imageKey: "coffee-cup",
    hintText: null,
  },
  {
    itemId: "2",
    categoryId: "food",
    categoryCode: "FOOD",
    categoryName: "Food",
    rarity: "EPIC",
    owned: false,
    quantity: 0,
    firstFoundAt: null,
    lastFoundAt: null,
    isFavorite: false,
    displayName: "Unknown Artifact",
    description: null,
    imageKey: null,
    hintText: "Undiscovered Food artifact",
  },
];

describe("inventory utilities", () => {
  it("calculates discovery percentage", () => {
    expect(calculateDiscoveryPercentage(1, 4)).toBe(25);
    expect(calculateDiscoveryPercentage(0, 0)).toBe(0);
  });

  it("filters by search only for owned artifact fields", () => {
    expect(filterInventoryItems(items, { search: "warm", ownership: "ALL" }).map((item) => item.itemId)).toEqual(["1"]);
    expect(filterInventoryItems(items, { search: "Food", ownership: "ALL" }).map((item) => item.itemId)).toEqual([]);
  });

  it("filters by category, rarity, ownership, and favorites", () => {
    expect(filterInventoryItems(items, { categoryId: "coffee", ownership: "OWNED" })).toHaveLength(1);
    expect(filterInventoryItems(items, { rarity: "EPIC", ownership: "UNOWNED" })).toHaveLength(1);
    expect(filterInventoryItems(items, { ownership: "FAVORITES" })).toHaveLength(1);
  });

  it("sorts by rarity and quantity", () => {
    expect(sortInventoryItems(items, "RARITY_DESC")[0]?.itemId).toBe("2");
    expect(sortInventoryItems(items, "QUANTITY_DESC")[0]?.itemId).toBe("1");
  });
});
