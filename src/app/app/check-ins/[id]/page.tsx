import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCheckInDetail } from "@/features/check-ins/actions";
import { StatusBadge } from "@/features/check-ins/status-badge";
import { requireUser } from "@/lib/auth/guards";

export default async function CheckInDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const detail = await getCheckInDetail(id);

  if (!detail) {
    notFound();
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Check-in result</h1>
        <p className="mt-2 text-[var(--muted)]">{new Date(detail.serverTimestamp).toLocaleString()}</p>
      </div>
      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-[var(--accent)]">
              {detail.categoryName}
            </p>
            <h2 className="mt-1 text-xl font-semibold">{detail.locationName}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{detail.locationAddress}</p>
          </div>
          <StatusBadge status={detail.validationStatus} />
        </div>
        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-[var(--muted)]">Distance</dt>
            <dd className="mt-1 font-medium">{Math.round(detail.calculatedDistanceM)} m</dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--muted)]">Reward status</dt>
            <dd className="mt-1 font-medium">{detail.rewardStatus}</dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--muted)]">Review</dt>
            <dd className="mt-1 font-medium">{detail.suspiciousFlag ? "Flagged" : "None"}</dd>
          </div>
        </dl>
        {detail.validationStatus === "VALID" ? (
          <div className="mt-6">
            <Button asChild>
              <Link href={`/app/check-ins/${detail.checkInId}/chest`}>
                {detail.rewardStatus === "GRANTED" ? "View reward" : "Open chest"}
              </Link>
            </Button>
          </div>
        ) : null}
      </Card>
      <Card className="p-5">
        <h2 className="text-lg font-semibold">Memory</h2>
        {detail.memoryId ? (
          <div className="mt-3 text-sm leading-6 text-[var(--muted)]">
            <p>{detail.memoryTitle}</p>
            <p>Visibility: {detail.memoryVisibility}</p>
            {detail.memoryNote ? <p>{detail.memoryNote}</p> : null}
          </div>
        ) : (
          <p className="mt-3 text-sm text-[var(--muted)]">
            No memory was created for this check-in result.
          </p>
        )}
      </Card>
    </div>
  );
}
