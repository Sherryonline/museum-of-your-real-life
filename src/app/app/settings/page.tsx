import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/guards";

export default async function SettingsPage() {
  const { user } = await requireUser();

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="mt-2 text-[var(--muted)]">Account settings available in Sprint 0.</p>
      </div>
      <Card className="p-5">
        <p className="text-sm text-[var(--muted)]">Signed in as</p>
        <p className="mt-2 font-medium">{user.email}</p>
      </Card>
    </div>
  );
}
