import { describe, expect, it } from "vitest";

import {
  calculateLootPercentages,
  effectivePeriodsOverlap,
  locationSchema,
  lootTableSchema,
  parseBadgeRuleValue,
  validateConfigurationValue,
} from "@/features/admin/schemas";

describe("admin schemas", () => {
  it("validates location coordinates and radius", () => {
    expect(() =>
      locationSchema.parse({
        code: "TEST",
        name: "Test Location",
        categoryId: "00000000-0000-0000-0000-000000000001",
        latitude: 91,
        longitude: 100,
        address: "Address",
        city: "City",
        district: "District",
        checkInRadiusM: 150,
        status: "ACTIVE",
      }),
    ).toThrow();
  });

  it("calculates loot percentages from positive weights", () => {
    expect(calculateLootPercentages([{ weight: 1 }, { weight: 3 }])).toEqual([
      { weight: 1, percentage: 25 },
      { weight: 3, percentage: 75 },
    ]);
  });

  it("detects effective date overlap with open-ended periods", () => {
    expect(
      effectivePeriodsOverlap(
        { from: new Date("2026-01-01T00:00:00Z"), to: null },
        { from: new Date("2026-06-01T00:00:00Z"), to: new Date("2026-07-01T00:00:00Z") },
      ),
    ).toBe(true);
  });

  it("rejects loot table end dates before start dates", () => {
    expect(() =>
      lootTableSchema.parse({
        code: "LOOT",
        categoryId: "00000000-0000-0000-0000-000000000001",
        name: "Loot",
        version: 1,
        effectiveFrom: "2026-02-01T00:00:00Z",
        effectiveTo: "2026-01-01T00:00:00Z",
        status: "ACTIVE",
      }),
    ).toThrow();
  });

  it("validates approved configuration ranges", () => {
    expect(validateConfigurationValue("NEARBY_RADIUS_M", 1000)).toBe(true);
    expect(validateConfigurationValue("NEARBY_RADIUS_M", -1)).toBe(false);
    expect(validateConfigurationValue("DAILY_HARD_CHECKIN_LIMIT", 10.5)).toBe(false);
  });

  it("validates fixed badge rule JSON", () => {
    expect(parseBadgeRuleValue("TOTAL_VALID_CHECKINS", '{"count":5}')).toEqual({ count: 5 });
    expect(() => parseBadgeRuleValue("FIRST_CATEGORY_CHECKIN", "{}")).toThrow();
  });
});
