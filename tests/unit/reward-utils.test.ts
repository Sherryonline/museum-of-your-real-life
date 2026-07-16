import { describe, expect, it } from "vitest";

import {
  calculateDuplicateXp,
  calculateLevel,
  formatRarity,
  selectWeightedOption,
} from "@/features/rewards/utils";

describe("reward utilities", () => {
  it("selects weighted options at boundaries", () => {
    const options = [
      { value: "COMMON", weight: 60 },
      { value: "UNCOMMON", weight: 25 },
      { value: "RARE", weight: 10 },
      { value: "EPIC", weight: 4 },
      { value: "LEGENDARY", weight: 1 },
    ];

    expect(selectWeightedOption(options, 0)).toBe("COMMON");
    expect(selectWeightedOption(options, 60)).toBe("UNCOMMON");
    expect(selectWeightedOption(options, 85)).toBe("RARE");
    expect(selectWeightedOption(options, 95)).toBe("EPIC");
    expect(selectWeightedOption(options, 99)).toBe("LEGENDARY");
  });

  it("calculates deterministic levels", () => {
    const levels = [
      { level: 1, requiredTotalXp: 0, title: "Visitor" },
      { level: 2, requiredTotalXp: 50, title: "Regular" },
      { level: 3, requiredTotalXp: 125, title: "Collector" },
    ];

    expect(calculateLevel(124, levels)).toMatchObject({ level: 2 });
    expect(calculateLevel(125, levels)).toMatchObject({ level: 3 });
  });

  it("formats rarities and duplicate XP", () => {
    expect(formatRarity("LEGENDARY")).toBe("Legendary");
    expect(calculateDuplicateXp(null)).toBe(5);
    expect(calculateDuplicateXp(8)).toBe(8);
  });
});
