import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/0002_sprint_1_location_checkins.sql"),
  "utf8",
);

describe("Sprint 1 migration", () => {
  it("creates required location and check-in tables", () => {
    for (const table of [
      "location_categories",
      "locations",
      "check_ins",
      "memories",
      "app_configurations",
    ]) {
      expect(migration).toContain(`create table if not exists public.${table}`);
      expect(migration).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it("seeds required configuration values from app_configurations", () => {
    for (const key of [
      "NEARBY_RADIUS_M",
      "DEFAULT_CHECKIN_RADIUS_M",
      "MAX_GPS_ACCURACY_M",
      "SAME_LOCATION_COOLDOWN_MINUTES",
      "DAILY_REWARDED_CHECKIN_LIMIT",
      "DAILY_HARD_CHECKIN_LIMIT",
      "SUSPICIOUS_TRAVEL_SPEED_KMH",
    ]) {
      expect(migration).toContain(key);
    }
  });

  it("seeds development location categories and locations", () => {
    for (const code of [
      "COFFEE",
      "FOOD",
      "CINEMA",
      "SHOPPING",
      "NATURE",
      "CULTURE",
      "TRAVEL",
      "LIFESTYLE",
    ]) {
      expect(migration).toContain(code);
    }

    expect((migration.match(/Development seed location/g) ?? []).length).toBeGreaterThanOrEqual(24);
  });

  it("defines trusted RPCs for nearby, check-in, history, and detail", () => {
    expect(migration).toContain("create or replace function public.get_nearby_locations");
    expect(migration).toContain("create or replace function public.process_check_in");
    expect(migration).toContain("create or replace function public.get_check_in_history");
    expect(migration).toContain("create or replace function public.get_check_in_detail");
    expect(migration).toContain("security definer");
  });

  it("blocks direct browser inserts while allowing own reads and memory editable updates", () => {
    expect(migration).not.toContain("grant insert on public.check_ins to authenticated");
    expect(migration).not.toContain("grant insert on public.memories to authenticated");
    expect(migration).toContain("grant update (note, photo_url, visibility) on public.memories to authenticated");
    expect(migration).toContain("check_ins_select_own_or_admin");
    expect(migration).toContain("memories_select_own_or_admin");
  });

  it("implements duplicate, cooldown, hard limit, suspicious travel, and atomic memory creation paths", () => {
    expect(migration).toContain("CHECKIN_ALREADY_PROCESSED");
    expect(migration).toContain("CHECKIN_COOLDOWN");
    expect(migration).toContain("CHECKIN_HARD_DAILY_LIMIT");
    expect(migration).toContain("CHECKIN_SUSPICIOUS_TRAVEL");
    expect(migration).toContain("insert into public.memories");
  });
});
