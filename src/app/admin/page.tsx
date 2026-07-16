import { ShieldCheck } from "lucide-react";

import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminPage() {
  const { supabase } = await requireAdmin();
  const [
    { count: profileCount },
    { count: roleCount },
    { count: locationCount },
    { count: checkInCount },
    { count: suspiciousCheckInCount },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("user_roles").select("id", { count: "exact", head: true }),
    supabase.from("locations").select("id", { count: "exact", head: true }),
    supabase.from("check_ins").select("id", { count: "exact", head: true }),
    supabase
      .from("check_ins")
      .select("id", { count: "exact", head: true })
      .eq("validation_status", "SUSPICIOUS"),
  ]);

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-7 w-7 text-[var(--accent)]" aria-hidden="true" />
        <div>
          <h1 className="text-3xl font-semibold">Admin</h1>
          <p className="mt-2 text-[var(--muted)]">Role-gated operational view for Sprint 1.</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="p-5">
          <p className="text-sm text-[var(--muted)]">Profiles</p>
          <p className="mt-2 text-2xl font-semibold">{profileCount ?? 0}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-[var(--muted)]">Role assignments</p>
          <p className="mt-2 text-2xl font-semibold">{roleCount ?? 0}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-[var(--muted)]">Locations</p>
          <p className="mt-2 text-2xl font-semibold">{locationCount ?? 0}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-[var(--muted)]">Check-ins</p>
          <p className="mt-2 text-2xl font-semibold">{checkInCount ?? 0}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-[var(--muted)]">Suspicious</p>
          <p className="mt-2 text-2xl font-semibold">{suspiciousCheckInCount ?? 0}</p>
        </Card>
      </div>
    </div>
  );
}
