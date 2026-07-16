import Link from "next/link";

import { Card } from "@/components/ui/card";
import { getCheckInHistory } from "@/features/check-ins/actions";
import { StatusBadge } from "@/features/check-ins/status-badge";
import { requireUser } from "@/lib/auth/guards";

export default async function CheckInsPage() {
  await requireUser();
  const history = await getCheckInHistory();

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Check-ins</h1>
        <p className="mt-2 text-[var(--muted)]">Your check-in history and validation results.</p>
      </div>
      {history.length === 0 ? (
        <Card className="p-5 text-sm text-[var(--muted)]">No check-ins yet.</Card>
      ) : (
        <div className="grid gap-3">
          {history.map((item) => (
            <Link href={`/app/check-ins/${item.checkInId}`} key={item.checkInId}>
              <Card className="p-5 transition hover:bg-slate-50">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-semibold">{item.locationName}</h2>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {item.categoryName} · {new Date(item.serverTimestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-[var(--muted)]">
                      {Math.round(item.calculatedDistanceM)} m
                    </span>
                    <StatusBadge status={item.validationStatus} />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
