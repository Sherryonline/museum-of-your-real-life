import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/0001_sprint_0_foundation.sql"),
  "utf8",
);

describe("Sprint 0 RLS migration", () => {
  it("enables RLS on all Sprint 0 tables", () => {
    expect(migration).toContain("alter table public.profiles enable row level security");
    expect(migration).toContain("alter table public.user_roles enable row level security");
    expect(migration).toContain("alter table public.audit_logs enable row level security");
  });

  it("limits authenticated profile updates to allowed columns", () => {
    expect(migration).toContain(
      "grant update (display_name, avatar_key, museum_visibility) on public.profiles to authenticated",
    );
    expect(migration).not.toContain("grant update on public.profiles to authenticated");
  });

  it("creates user bootstrap and admin guard functions with fixed search_path", () => {
    expect(migration).toContain("create or replace function public.handle_new_user()");
    expect(migration).toContain("create or replace function public.is_admin()");
    expect(migration).toContain("set search_path = public");
  });
});
