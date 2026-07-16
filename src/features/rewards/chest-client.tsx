"use client";

import { Gift, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RarityBadge } from "@/features/rewards/rarity-badge";
import { openRewardForCheckIn } from "@/features/rewards/actions";
import type { RewardResult } from "@/features/rewards/types";

export function ChestClient({
  checkInId,
  initialReward,
  rewardStatus,
  validationStatus,
}: Readonly<{
  checkInId: string;
  initialReward: RewardResult | null;
  rewardStatus: string;
  validationStatus: string;
}>) {
  const [reward, setReward] = useState<RewardResult | null>(initialReward);
  const [isPending, startTransition] = useTransition();
  const unavailable = validationStatus !== "VALID" || rewardStatus === "BLOCKED" || rewardStatus === "NOT_APPLICABLE";

  function openChest() {
    startTransition(async () => {
      setReward(await openRewardForCheckIn(checkInId));
    });
  }

  return (
    <div className="grid gap-6">
      {validationStatus === "SUSPICIOUS" ? (
        <Alert>Check-in is under review. No reward is available.</Alert>
      ) : null}
      {unavailable && !reward ? (
        <Alert tone="danger">Reward is unavailable for this check-in.</Alert>
      ) : null}
      <Card className="overflow-hidden p-6">
        <div className="mx-auto grid max-w-xl place-items-center gap-6 text-center">
          <div className="grid h-36 w-36 place-items-center rounded-md border border-[var(--border)] bg-slate-50 motion-safe:transition motion-safe:duration-500">
            {isPending ? (
              <Loader2 aria-hidden="true" className="h-12 w-12 animate-spin text-[var(--accent)]" />
            ) : (
              <Gift aria-hidden="true" className="h-14 w-14 text-[var(--accent)]" />
            )}
          </div>
          {!reward ? (
            <>
              <div>
                <h2 className="text-2xl font-semibold">Category chest</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  One valid check-in can open this chest once.
                </p>
              </div>
              <Button disabled={isPending || unavailable} onClick={openChest}>
                {isPending ? "Opening..." : "Open chest"}
              </Button>
            </>
          ) : reward.errorCode ? (
            <Alert tone="danger">{reward.message}</Alert>
          ) : (
            <div className="grid gap-4">
              <div>
                {reward.rarity ? <RarityBadge rarity={reward.rarity} /> : null}
                <h2 className="mt-3 text-2xl font-semibold">{reward.itemName}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{reward.itemDescription}</p>
              </div>
              <dl className="grid gap-3 sm:grid-cols-3">
                <div>
                  <dt className="text-sm text-[var(--muted)]">XP</dt>
                  <dd className="font-semibold">{reward.xpAwarded}</dd>
                </div>
                <div>
                  <dt className="text-sm text-[var(--muted)]">Quantity</dt>
                  <dd className="font-semibold">{reward.inventoryQuantity}</dd>
                </div>
                <div>
                  <dt className="text-sm text-[var(--muted)]">Level</dt>
                  <dd className="font-semibold">
                    {reward.level} · {reward.levelTitle}
                  </dd>
                </div>
              </dl>
              {reward.duplicate ? <Alert>Duplicate item. Inventory quantity increased.</Alert> : null}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
