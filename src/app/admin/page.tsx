import Link from "next/link";
import { ClipboardCheck, ShieldCheck } from "lucide-react";

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
    { count: feedbackCount },
    { count: auditCount },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("user_roles").select("id", { count: "exact", head: true }),
    supabase.from("locations").select("id", { count: "exact", head: true }),
    supabase.from("check_ins").select("id", { count: "exact", head: true }),
    supabase
      .from("check_ins")
      .select("id", { count: "exact", head: true })
      .eq("validation_status", "SUSPICIOUS"),
    supabase.from("beta_feedback").select("id", { count: "exact", head: true }),
    supabase.from("audit_logs").select("id", { count: "exact", head: true }),
  ]);
  const sections = [
    ["Locations", "/admin/locations"],
    ["Categories", "/admin/categories"],
    ["Items", "/admin/items"],
    ["Loot tables", "/admin/loot-tables"],
    ["Collections", "/admin/collections"],
    ["Badges", "/admin/badges"],
    ["Configuration", "/admin/configuration"],
    ["Check-in review", "/admin/check-ins"],
    ["Audit logs", "/admin/audit-logs"],
    ["Beta feedback", "/admin/beta-feedback"],
  ] as const;

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-7 w-7 text-[var(--accent)]" aria-hidden="true" />
        <div>
          <h1 className="text-3xl font-semibold">Admin</h1>
          <p className="mt-2 text-[var(--muted)]">Role-gated content management and beta operations.</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
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
        <Card className="p-5">
          <p className="text-sm text-[var(--muted)]">Feedback</p>
          <p className="mt-2 text-2xl font-semibold">{feedbackCount ?? 0}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-[var(--muted)]">Audit logs</p>
          <p className="mt-2 text-2xl font-semibold">{auditCount ?? 0}</p>
        </Card>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map(([label, href]) => (
          <Link key={href} href={href}>
            <Card className="flex items-center gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-md">
              <ClipboardCheck className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
              <span className="font-medium">{label}</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
