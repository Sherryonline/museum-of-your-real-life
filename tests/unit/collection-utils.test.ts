import { describe, expect, it } from "vitest";

import {
  calculateCollectionProgress,
  getBadgeRuleLabel,
  getCollectionCompletionStatus,
  isWeekend,
} from "@/features/collections/utils";

describe("collection utilities", () => {
  it("calculates unique item progress percentage", () => {
    expect(calculateCollectionProgress(0, 5)).toBe(0);
    expect(calculateCollectionProgress(2, 5)).toBe(40);
    expect(calculateCollectionProgress(5, 5)).toBe(100);
    expect(calculateCollectionProgress(8, 5)).toBe(100);
  });

  it("resolves collection completion status", () => {
    expect(getCollectionCompletionStatus(99.99)).toBe("IN_PROGRESS");
    expect(getCollectionCompletionStatus(100)).toBe("COMPLETED");
  });

  it("detects weekends in UTC", () => {
    expect(isWeekend(new Date("2026-07-18T12:00:00Z"))).toBe(true);
    expect(isWeekend(new Date("2026-07-20T12:00:00Z"))).toBe(false);
  });

  it("formats fixed badge rule labels", () => {
    expect(getBadgeRuleLabel("FIRST_MEMORY")).toBe("First memory");
    expect(getBadgeRuleLabel("COLLECTION_COMPLETED")).toBe("Collection completed");
  });
});
