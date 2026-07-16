import { notFound } from "next/navigation";

import { ChestClient } from "@/features/rewards/chest-client";
import { getCheckInDetail } from "@/features/check-ins/actions";
import { getRewardForCheckIn } from "@/features/rewards/actions";
import { requireUser } from "@/lib/auth/guards";

export default async function ChestPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const detail = await getCheckInDetail(id);

  if (!detail) {
    notFound();
  }

  const reward = await getRewardForCheckIn(id);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Open chest</h1>
        <p className="mt-2 text-[var(--muted)]">{detail.locationName}</p>
      </div>
      <ChestClient
        checkInId={id}
        initialReward={reward}
        rewardStatus={detail.rewardStatus}
        validationStatus={detail.validationStatus}
      />
    </div>
  );
}
