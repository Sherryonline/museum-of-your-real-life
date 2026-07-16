import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(join(process.cwd(), "supabase/migrations/0006_inventory_2_foundation.sql"), "utf8");
const actions = readFileSync(join(process.cwd(), "src/features/inventory/actions.ts"), "utf8");

describe("Inventory 2.0 Sprint 1 foundation", () => {
  it("adds favorites table with RLS and no direct normal mutation grants", () => {
    expect(migration).toContain("create table if not exists public.user_item_favorites");
    expect(migration).toContain("alter table public.user_item_favorites enable row level security");
    expect(migration).toContain("user_item_favorites_select_own_or_admin");
    expect(migration).not.toContain("grant insert on public.user_item_favorites to authenticated");
    expect(migration).not.toContain("grant delete on public.user_item_favorites to authenticated");
  });

  it("exposes server-side dashboard, listing, detail, and favorite RPCs", () => {
    for (const fn of [
      "get_inventory_dashboard",
      "get_inventory_listing",
      "get_artifact_detail",
      "set_item_favorite",
    ]) {
      expect(migration).toContain(`function public.${fn}`);
      expect(migration).toContain(`grant execute on function public.${fn}`);
    }
  });

  it("prevents unknown artifact data leakage", () => {
    expect(migration).toContain("case when counted.owned then counted.name else 'Unknown Artifact' end");
    expect(migration).toContain("case when counted.owned then counted.description else null end");
    expect(migration).toContain("case when counted.owned then counted.image_key else null end");
  });

  it("enforces pagination and favorite max server-side", () => {
    expect(migration).toContain("limit 20");
    expect(migration).toContain("current_count >= 20");
    expect(migration).toContain("pg_advisory_xact_lock");
  });

  it("keeps inventory actions server-side", () => {
    expect(actions).toContain('"use server"');
    expect(actions).toContain("getInventoryDashboard");
    expect(actions).toContain("getInventoryListing");
    expect(actions).toContain("getArtifactDetail");
    expect(actions).toContain("setFavoriteArtifactAction");
  });
});
