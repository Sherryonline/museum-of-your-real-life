import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/0003_sprint_2_reward_inventory.sql"),
  "utf8",
);

describe("Sprint 2 migration", () => {
  it("creates reward, inventory, XP, loot, item, and level tables", () => {
    for (const table of [
      "items",
      "loot_tables",
      "loot_table_items",
      "reward_transactions",
      "user_inventory",
      "xp_transactions",
      "level_configurations",
    ]) {
      expect(migration).toContain(`create table if not exists public.${table}`);
      expect(migration).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it("makes valid check-ins rewardable without adding frontend reward control", () => {
    expect(migration).toContain("check_ins_set_pending_reward");
    expect(migration).toContain("new.validation_status = 'VALID'");
    expect(migration).toContain("new.reward_status = 'PENDING'");
    expect(migration).toContain("'GRANTED'");
  });

  it("defines an atomic idempotent reward RPC", () => {
    expect(migration).toContain("create or replace function public.open_check_in_reward");
    expect(migration).toContain("for update");
    expect(migration).toContain("where rt.user_id = actor_id");
    expect(migration).toContain("update public.check_ins");
    expect(migration).toContain("set reward_status = 'GRANTED'");
  });

  it("seeds rarity distribution, duplicate XP, and ten levels", () => {
    for (const rarity of ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"]) {
      expect(migration).toContain(rarity);
    }

    expect(migration).toContain("DUPLICATE_ITEM_XP");
    expect((migration.match(/\(\d+, \d+, '/g) ?? []).length).toBeGreaterThanOrEqual(10);
  });

  it("blocks direct reward and inventory manipulation by normal users", () => {
    expect(migration).not.toContain("grant insert on public.reward_transactions to authenticated");
    expect(migration).not.toContain("grant insert on public.user_inventory to authenticated");
    expect(migration).not.toContain("grant update on public.user_inventory to authenticated");
    expect(migration).toContain("reward_transactions_select_own_or_admin");
    expect(migration).toContain("user_inventory_select_own_or_admin");
    expect(migration).toContain("xp_transactions_select_own_or_admin");
  });
});
