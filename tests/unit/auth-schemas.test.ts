import { describe, expect, it } from "vitest";

import { loginSchema, registerSchema, resetPasswordSchema } from "@/features/auth/schemas";

describe("auth schemas", () => {
  it("accepts a valid login", () => {
    expect(loginSchema.parse({ email: "person@example.com", password: "secret" })).toEqual({
      email: "person@example.com",
      password: "secret",
    });
  });

  it("rejects registration password mismatches", () => {
    const result = registerSchema.safeParse({
      displayName: "Sherry",
      email: "person@example.com",
      password: "password-1",
      confirmPassword: "password-2",
    });

    expect(result.success).toBe(false);
  });

  it("requires strong enough reset passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: "short",
      confirmPassword: "short",
    });

    expect(result.success).toBe(false);
  });
});
