import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/guards";

export default async function AppHomePage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name,museum_visibility,status")
    .eq("id", user.id)
    .single();

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="mt-2 text-[var(--muted)]">Sprint 0 account foundation is active.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-[var(--muted)]">Profile</p>
          <p className="mt-2 text-xl font-semibold">{profile?.display_name ?? "Not configured"}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-[var(--muted)]">Visibility</p>
          <p className="mt-2 text-xl font-semibold">{profile?.museum_visibility ?? "PRIVATE"}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-[var(--muted)]">Status</p>
          <p className="mt-2 text-xl font-semibold">{profile?.status ?? "ACTIVE"}</p>
        </Card>
      </div>
    </div>
  );
}
