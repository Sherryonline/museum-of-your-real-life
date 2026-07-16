import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/0007_inventory_2_discovery_progression.sql"),
  "utf8",
);

describe("Inventory 2.0 Sprint 2 migration", () => {
  it("creates user discovery records with RLS", () => {
    expect(migration).toContain("create table if not exists public.user_discovered_items");
    expect(migration).toContain("unique (user_id, item_id)");
    expect(migration).toContain("alter table public.user_discovered_items enable row level security");
    expect(migration).toContain("user_discovered_items_select_own_or_admin");
  });

  it("does not grant player manipulation of discovery records", () => {
    expect(migration).not.toContain("grant insert on public.user_discovered_items to authenticated");
    expect(migration).not.toContain("grant update on public.user_discovered_items to authenticated");
    expect(migration).not.toContain("grant delete on public.user_discovered_items to authenticated");
  });

  it("records first and duplicate discovery from reward transactions", () => {
    expect(migration).toContain("record_item_discovery_from_reward");
    expect(migration).toContain("after insert on public.reward_transactions");
    expect(migration).toContain("on conflict (user_id, item_id) do update");
    expect(migration).toContain("discover_count = public.user_discovered_items.discover_count +");
  });

  it("adds requested read APIs as RPCs", () => {
    for (const fn of [
      "get_inventory_book",
      "get_inventory_progress",
      "get_inventory_recommendations",
      "get_inventory_statistics",
      "get_artifact_timeline",
    ]) {
      expect(migration).toContain(`function public.${fn}`);
      expect(migration).toContain(`grant execute on function public.${fn}`);
    }
  });

  it("prevents unknown artifact data leakage in book RPC", () => {
    expect(migration).toContain("case when counted.discovered then counted.name else 'Unknown Artifact' end");
    expect(migration).toContain("case when counted.discovered then counted.rarity else null end");
    expect(migration).toContain("case when counted.discovered then counted.image_key else null end");
    expect(migration).toContain("limit 24");
  });

  it("limits timeline to newest 20 entries", () => {
    expect(migration).toContain("order by ci.server_timestamp desc");
    expect(migration).toContain("limit 20");
  });
});
