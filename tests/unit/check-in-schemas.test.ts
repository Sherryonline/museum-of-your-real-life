import { describe, expect, it } from "vitest";

import { checkInRequestSchema, nearbyRequestSchema } from "@/features/check-ins/schemas";

describe("check-in schemas", () => {
  it("accepts a valid nearby request", () => {
    expect(
      nearbyRequestSchema.parse({ latitude: 13.7563, longitude: 100.5018, accuracy: 15 }),
    ).toEqual({ latitude: 13.7563, longitude: 100.5018, accuracy: 15 });
  });

  it("rejects invalid check-in coordinates and accuracy", () => {
    const result = checkInRequestSchema.safeParse({
      locationId: crypto.randomUUID(),
      latitude: 120,
      longitude: 100.5018,
      accuracy: 0,
      clientTimestamp: new Date().toISOString(),
      idempotencyKey: crypto.randomUUID(),
    });

    expect(result.success).toBe(false);
  });
});
