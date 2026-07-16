import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminAuditLogsPage() {
  const { supabase } = await requireAdmin();
  const { data: logRows } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  const logs = logRows ?? [];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Audit logs</h1>
        <p className="mt-2 text-[var(--muted)]">Admin mutation trail with safe before/after metadata.</p>
      </div>
      <div className="grid gap-3">
        {logs.map((log) => (
          <Card key={log.id} className="p-4">
            <div className="grid gap-1 text-sm">
              <p className="font-medium">
                {log.action} · {log.entity_type}
              </p>
              <p className="text-[var(--muted)]">
                Actor {log.actor_user_id?.slice(0, 8) ?? "system"}… · Entity {log.entity_id ?? "n/a"} ·{" "}
                {new Date(log.created_at).toLocaleString()}
              </p>
              <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-100">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
