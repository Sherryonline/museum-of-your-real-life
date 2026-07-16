import { MapPin } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCheckInHistory } from "@/features/check-ins/actions";
import { StatusBadge } from "@/features/check-ins/status-badge";
import { requireUser } from "@/lib/auth/guards";

export default async function AppHomePage() {
  const { supabase, user } = await requireUser();
  const [{ data: profile }, checkIns, { count: memoryCount }] = await Promise.all([
    supabase.from("profiles").select("display_name,museum_visibility,status").eq("id", user.id).single(),
    getCheckInHistory(),
    supabase.from("memories").select("id", { count: "exact", head: true }),
  ]);
  const latestValidMemory = checkIns.find((item) => item.validationStatus === "VALID" && item.memoryId);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="mt-2 text-[var(--muted)]">Check in to nearby real-life locations.</p>
        </div>
        <Button asChild>
          <Link href="/app/nearby">
            <MapPin aria-hidden="true" className="h-4 w-4" />
            Check in nearby
          </Link>
        </Button>
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
          <p className="text-sm text-[var(--muted)]">Memories</p>
          <p className="mt-2 text-xl font-semibold">{memoryCount ?? 0}</p>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Recent check-ins</h2>
            <Link className="text-sm text-[var(--accent)] hover:underline" href="/app/check-ins">
              View all
            </Link>
          </div>
          <div className="mt-4 grid gap-3">
            {checkIns.slice(0, 3).map((item) => (
              <div className="flex items-center justify-between gap-3" key={item.checkInId}>
                <div>
                  <p className="font-medium">{item.locationName}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {new Date(item.serverTimestamp).toLocaleString()}
                  </p>
                </div>
                <StatusBadge status={item.validationStatus} />
              </div>
            ))}
            {checkIns.length === 0 ? <p className="text-sm text-[var(--muted)]">No check-ins yet.</p> : null}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-lg font-semibold">Latest valid memory</h2>
          {latestValidMemory ? (
            <div className="mt-4">
              <p className="font-medium">{latestValidMemory.locationName}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {latestValidMemory.categoryName} ·{" "}
                {new Date(latestValidMemory.serverTimestamp).toLocaleString()}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[var(--muted)]">No valid memory yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
