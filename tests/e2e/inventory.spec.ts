import { expect, test } from "@playwright/test";

test("inventory discovery APIs require authentication", async ({ request }) => {
  for (const endpoint of [
    "/api/inventory/book",
    "/api/inventory/progress",
    "/api/inventory/recommendations",
    "/api/inventory/statistics",
    "/api/inventory/timeline/00000000-0000-0000-0000-000000000001",
  ]) {
    const response = await request.get(endpoint);
    expect(response.status(), endpoint).toBe(401);
  }
});
