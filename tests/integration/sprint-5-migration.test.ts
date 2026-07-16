import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(join(process.cwd(), "supabase/migrations/0005_sprint_5_admin_beta_ops.sql"), "utf8");
const actions = readFileSync(join(process.cwd(), "src/features/admin/actions.ts"), "utf8");

describe("Sprint 5 admin and beta operations", () => {
  it("creates beta feedback with RLS", () => {
    expect(migration).toContain("create table if not exists public.beta_feedback");
    expect(migration).toContain("alter table public.beta_feedback enable row level security");
    expect(migration).toContain("beta_feedback_insert_own");
    expect(migration).toContain("beta_feedback_admin_update_status");
  });

  it("requires server-side admin authorization for admin mutations", () => {
    const mutationNames = [
      "saveCategoryAction",
      "saveLocationAction",
      "saveItemAction",
      "saveLootTableAction",
      "saveLootTableItemAction",
      "saveCollectionAction",
      "saveCollectionItemAction",
      "saveBadgeAction",
      "updateConfigurationAction",
      "reviewCheckInAction",
      "updateFeedbackStatusAction",
    ];

    for (const name of mutationNames) {
      const start = actions.indexOf(`export async function ${name}`);
      const end = actions.indexOf("export async function", start + 1);
      const body = actions.slice(start, end === -1 ? undefined : end);
      expect(body).toContain("requireAdmin()");
    }
  });

  it("audits every admin mutation", () => {
    expect(migration).toContain("create or replace function public.record_admin_audit");
    expect(migration).toContain("create or replace function public.audit_admin_table_mutation");
    expect(migration).toContain("locations_admin_audit");
    expect(migration).toContain("beta_feedback_admin_audit");
    expect(migration).toContain("- 'user_latitude' - 'user_longitude' - 'idempotency_key'");
    expect(migration).toContain("raise exception 'ADMIN_REQUIRED'");
    expect(actions.match(/recordAudit\(/g)?.length).toBeGreaterThanOrEqual(11);
  });

  it("blocks unsafe deletes and loot table overlaps at the database layer", () => {
    expect(migration).toContain("prevent_protected_delete");
    expect(migration).toContain("LOCATION_HAS_CHECK_INS");
    expect(migration).toContain("ITEM_IS_REFERENCED");
    expect(migration).toContain("prevent_loot_table_overlap");
    expect(migration).toContain("loot_tables_no_active_overlap");
    expect(migration).toContain("exclude using gist");
    expect(migration).toContain("LOOT_TABLE_EFFECTIVE_PERIOD_OVERLAP");
  });

  it("validates configuration keys at the database layer", () => {
    expect(migration).toContain("validate_allowed_app_configuration");
    expect(migration).toContain("CONFIGURATION_KEY_NOT_ALLOWED");
    expect(migration).toContain("CONFIGURATION_VALUE_OUT_OF_RANGE");
  });

  it("supports check-in review without granting broad public mutation", () => {
    expect(migration).toContain("grant update (validation_status, suspicious_flag, suspicious_reason, reward_status)");
    expect(migration).toContain("check_ins_admin_update_review");
    expect(migration).not.toContain("grant update on public.check_ins to anon");
  });
});
