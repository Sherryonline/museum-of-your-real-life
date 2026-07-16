import { describe, expect, it } from "vitest";

import { profileUpdateSchema } from "@/features/profile/schemas";

describe("profile schema", () => {
  it("accepts editable profile fields", () => {
    expect(
      profileUpdateSchema.parse({
        displayName: "Sherry",
        avatarKey: "default",
        museumVisibility: "PRIVATE",
      }),
    ).toEqual({
      displayName: "Sherry",
      avatarKey: "default",
      museumVisibility: "PRIVATE",
    });
  });

  it("does not accept system fields", () => {
    const result = profileUpdateSchema.safeParse({
      displayName: "Sherry",
      avatarKey: "default",
      museumVisibility: "PRIVATE",
      status: "SUSPENDED",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("status");
    }
  });
});
