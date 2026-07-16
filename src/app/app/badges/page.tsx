import { Award } from "lucide-react";

import { Card } from "@/components/ui/card";
import { getBadges } from "@/features/collections/actions";
import { getBadgeRuleLabel } from "@/features/collections/utils";
import { requireUser } from "@/lib/auth/guards";

export default async function BadgesPage() {
  await requireUser();
  const badges = await getBadges();

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Badges</h1>
        <p className="mt-2 text-[var(--muted)]">Earned badges and safe progress hints.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {badges.map((badge) => (
          <Card className={badge.earned ? "p-5" : "p-5 opacity-70"} key={badge.badgeId}>
            <div className="flex items-start gap-3">
              <Award className="mt-1 h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{badge.name}</h2>
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs">
                    {badge.earned ? "Earned" : "Locked"}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{badge.description}</p>
                <p className="mt-3 text-sm text-[var(--muted)]">{getBadgeRuleLabel(badge.ruleType)}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {badge.earned && badge.awardedAt
                    ? `Awarded ${new Date(badge.awardedAt).toLocaleString()}`
                    : badge.progressHint}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
