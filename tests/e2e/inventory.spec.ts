import { expect, test } from "@playwright/test";

test("inventory route requires authentication", async ({ page }) => {
  await page.goto("/app/inventory");
  await expect(page).toHaveURL(/\/login/);
});

test("inventory filters remain behind authentication", async ({ page }) => {
  await page.goto("/app/inventory?ownership=ALL&sort=RARITY_DESC&q=coffee");
  await expect(page).toHaveURL(/\/login/);
});
