import { expect, test } from "@playwright/test";

test("public page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Museum of Your Real Life" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Register" })).toBeVisible();
});
