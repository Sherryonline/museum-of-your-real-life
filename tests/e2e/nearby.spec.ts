import { expect, test } from "@playwright/test";

test.describe("nearby geolocation UI", () => {
  test("shows permission denied state on the public auth boundary", async ({ context, page }) => {
    await context.grantPermissions([], { origin: "http://127.0.0.1:3000" });
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  });
});
