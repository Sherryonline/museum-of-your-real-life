import { describe, expect, it } from "vitest";

import {
  categoryProgress,
  deterministicRecommendations,
  discoveryPercentage,
  inventoryStatistics,
  newestFirstTimeline,
} from "@/features/inventory/discovery-utils";

describe("inventory discovery utilities", () => {
  it("calculates discovery percentage", () => {
    expect(discoveryPercentage(18, 25)).toBe(72);
    expect(discoveryPercentage(0, 0)).toBe(0);
  });

  it("calculates category progress", () => {
    expect(categoryProgress(8, 30)).toEqual({
      ownedUniqueItems: 8,
      totalItems: 30,
      discoveryPercentage: 26.67,
    });
  });

  it("returns deterministic recommendations", () => {
    const recommendations = deterministicRecommendations([
      {
        category_id: "coffee",
        category_code: "COFFEE",
        category_name: "Coffee",
        owned_unique_items: 18,
        total_items: 20,
        discovery_percentage: 90,
      },
      {
        category_id: "nature",
        category_code: "NATURE",
        category_name: "Nature",
        owned_unique_items: 1,
        total_items: 10,
        discovery_percentage: 10,
      },
    ]);

    expect(recommendations[0]?.categoryName).toBe("Nature");
    expect(recommendations[1]?.categoryName).toBe("Coffee");
  });

  it("orders timeline newest first and caps to 20", () => {
    const ordered = newestFirstTimeline([
      { visitDate: "2026-07-15T00:00:00Z" },
      { visitDate: "2026-07-20T00:00:00Z" },
      { visitDate: "2026-07-18T00:00:00Z" },
    ]);

    expect(ordered.map((item) => item.visitDate)).toEqual([
      "2026-07-20T00:00:00Z",
      "2026-07-18T00:00:00Z",
      "2026-07-15T00:00:00Z",
    ]);
  });

  it("calculates duplicate statistics", () => {
    expect(inventoryStatistics({ totalArtifacts: 10, uniqueArtifacts: 3, discoverCounts: [1, 2, 5] })).toEqual({
      duplicateArtifacts: 5,
      discoveryPercentage: 30,
    });
  });
});
