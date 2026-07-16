import { reviewCheckInAction } from "@/features/admin/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth/guards";

const reviewCheckInFormAction = reviewCheckInAction as unknown as (formData: FormData) => Promise<void>;

export default async function AdminCheckInsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; suspicious?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const { supabase } = await requireAdmin();
  let query = supabase
    .from("check_ins")
    .select("*")
    .order("server_timestamp", { ascending: false })
    .limit(80);
  if (params.status === "VALID" || params.status === "REJECTED" || params.status === "SUSPICIOUS") {
    query = query.eq("validation_status", params.status);
  }
  if (params.suspicious === "true") query = query.eq("suspicious_flag", true);
  if (params.from) query = query.gte("server_timestamp", params.from);
  if (params.to) query = query.lte("server_timestamp", params.to);
  if (params.q) query = query.or(`id.eq.${params.q},location_id.eq.${params.q},user_id.eq.${params.q}`);
  const { data: checkInRows } = await query;
  const checkIns = checkInRows ?? [];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Check-in review</h1>
        <p className="mt-2 text-[var(--muted)]">
          Review validation details, suspicious flags, and correlation IDs without exposing unnecessary personal data.
        </p>
      </div>
      <Card className="p-5">
        <form className="grid gap-3 md:grid-cols-5">
          <Input name="q" placeholder="ID / user ID / location ID" defaultValue={params.q} />
          <select name="status" defaultValue={params.status ?? ""} className="h-10 rounded-md border px-3 text-sm">
            <option value="">All statuses</option>
            <option value="VALID">VALID</option>
            <option value="REJECTED">REJECTED</option>
            <option value="SUSPICIOUS">SUSPICIOUS</option>
          </select>
          <select name="suspicious" defaultValue={params.suspicious ?? ""} className="h-10 rounded-md border px-3 text-sm">
            <option value="">Any suspicious flag</option>
            <option value="true">Suspicious only</option>
          </select>
          <Input name="from" placeholder="From ISO date" defaultValue={params.from} />
          <Button type="submit" variant="outline">
            Filter
          </Button>
        </form>
      </Card>
      <div className="grid gap-3">
        {checkIns.map((checkIn) => (
          <Card key={checkIn.id} className="grid gap-3 p-4">
            <div className="grid gap-1 text-sm text-[var(--muted)] md:grid-cols-3">
              <p>
                <span className="font-medium text-[var(--foreground)]">Location:</span>{" "}
                {checkIn.location_id}
              </p>
              <p>
                <span className="font-medium text-[var(--foreground)]">Correlation:</span> {checkIn.id}
              </p>
              <p>
                <span className="font-medium text-[var(--foreground)]">Distance:</span>{" "}
                {Number(checkIn.calculated_distance_m).toFixed(1)}m
              </p>
              <p>GPS accuracy: {Number(checkIn.gps_accuracy_m).toFixed(1)}m</p>
              <p>User ref: {checkIn.user_id.slice(0, 8)}…</p>
              <p>{new Date(checkIn.server_timestamp).toLocaleString()}</p>
            </div>
            <form action={reviewCheckInFormAction} className="grid gap-3 md:grid-cols-5">
              <input type="hidden" name="checkInId" value={checkIn.id} />
              <select
                name="validationStatus"
                defaultValue={checkIn.validation_status}
                className="h-10 rounded-md border px-3 text-sm"
              >
                <option value="VALID">VALID</option>
                <option value="REJECTED">REJECTED</option>
                <option value="SUSPICIOUS">SUSPICIOUS</option>
              </select>
              <select
                name="suspiciousFlag"
                defaultValue={String(checkIn.suspicious_flag)}
                className="h-10 rounded-md border px-3 text-sm"
              >
                <option value="false">Not suspicious</option>
                <option value="true">Suspicious</option>
              </select>
              <select name="rewardStatus" defaultValue={checkIn.reward_status} className="h-10 rounded-md border px-3 text-sm">
                <option value="NOT_APPLICABLE">NOT_APPLICABLE</option>
                <option value="PENDING">PENDING</option>
                <option value="GRANTED">GRANTED</option>
                <option value="BLOCKED">BLOCKED</option>
              </select>
              <Input name="suspiciousReason" defaultValue={checkIn.suspicious_reason ?? ""} placeholder="Review reason" />
              <Button type="submit" variant="outline">
                Save review
              </Button>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
