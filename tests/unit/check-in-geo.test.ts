import { describe, expect, it } from "vitest";

import {
  calculateTravelSpeedKmh,
  haversineDistanceMeters,
  isDailyLimitReached,
  isValidAccuracy,
  isValidLatitude,
  isValidLongitude,
  isWithinCooldown,
} from "@/features/check-ins/geo";

describe("check-in geo utilities", () => {
  it("calculates Haversine distance", () => {
    const distance = haversineDistanceMeters(
      { latitude: 13.7563, longitude: 100.5018 },
      { latitude: 13.7563, longitude: 100.5038 },
    );

    expect(distance).toBeGreaterThan(200);
    expect(distance).toBeLessThan(230);
  });

  it("validates coordinates and accuracy", () => {
    expect(isValidLatitude(90)).toBe(true);
    expect(isValidLatitude(91)).toBe(false);
    expect(isValidLongitude(-180)).toBe(true);
    expect(isValidLongitude(-181)).toBe(false);
    expect(isValidAccuracy(5)).toBe(true);
    expect(isValidAccuracy(0)).toBe(false);
  });

  it("calculates travel speed", () => {
    expect(calculateTravelSpeedKmh(150_000, 60 * 60 * 1000)).toBe(150);
    expect(calculateTravelSpeedKmh(150_000, 0)).toBeNull();
  });

  it("evaluates cooldown and daily limits", () => {
    const now = new Date("2026-07-16T12:00:00.000Z");
    expect(isWithinCooldown(new Date("2026-07-16T10:00:00.000Z"), now, 240)).toBe(true);
    expect(isWithinCooldown(new Date("2026-07-16T07:00:00.000Z"), now, 240)).toBe(false);
    expect(isDailyLimitReached(30, 30)).toBe(true);
    expect(isDailyLimitReached(29, 30)).toBe(false);
  });
});
