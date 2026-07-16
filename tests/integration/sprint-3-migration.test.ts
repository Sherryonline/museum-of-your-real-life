import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/0004_sprint_3_collections_badges.sql"),
  "utf8",
);

describe("Sprint 3 migration", () => {
  it("creates collections and badges tables with RLS", () => {
    for (const table of [
      "collections",
      "collection_items",
      "user_collection_progress",
      "badges",
      "user_badges",
    ]) {
      expect(migration).toContain(`create table if not exists public.${table}`);
      expect(migration).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it("seeds fixed badge rules only", () => {
    for (const rule of [
      "FIRST_MEMORY",
      "FIRST_CATEGORY_CHECKIN",
      "TOTAL_VALID_CHECKINS",
      "UNIQUE_LOCATIONS",
      "UNIQUE_CATEGORIES",
      "COLLECTION_COMPLETED",
      "WEEKEND_CHECKINS",
    ]) {
      expect(migration).toContain(rule);
    }

    expect(migration).not.toContain("NO_CODE_RULE_ENGINE");
  });

  it("uses unique inventory inserts for collection progress", () => {
    expect(migration).toContain("after insert on public.user_inventory");
    expect(migration).toContain("count(distinct ui.item_id)");
    expect(migration).toContain("owned_unique_items");
    expect(migration).not.toContain("sum(ui.quantity)");
  });

  it("grants completion XP and badges once", () => {
    expect(migration).toContain("COLLECTION_COMPLETION");
    expect(migration).toContain("on conflict (source_type, source_id) do nothing");
    expect(migration).toContain("on conflict (user_id, badge_id) do nothing");
  });

  it("blocks direct user mutation of progress and badges", () => {
    expect(migration).not.toContain("grant insert on public.user_collection_progress to authenticated");
    expect(migration).not.toContain("grant insert on public.user_badges to authenticated");
    expect(migration).toContain("user_collection_progress_select_own_or_admin");
    expect(migration).toContain("user_badges_select_own_or_admin");
  });

  it("prevents collection item category mismatches", () => {
    expect(migration).toContain("validate_collection_item_category");
    expect(migration).toContain("COLLECTION_ITEM_CATEGORY_MISMATCH");
  });
});
