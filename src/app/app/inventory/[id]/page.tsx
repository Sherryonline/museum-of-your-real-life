import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { FavoriteButton } from "@/features/inventory/favorite-button";
import { getArtifactDetail } from "@/features/inventory/actions";
import { getArtifactTimeline } from "@/features/inventory/discovery-actions";
import { TimelineCard } from "@/features/inventory/discovery-components";
import { RarityBadge } from "@/features/rewards/rarity-badge";
import { requireUser } from "@/lib/auth/guards";

export default async function ArtifactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const [artifact, timeline] = await Promise.all([getArtifactDetail(id), getArtifactTimeline(id)]);

  if (!artifact) {
    notFound();
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <div>
        <p className="text-sm text-[var(--muted)]">{artifact.categoryName}</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold">{artifact.displayName}</h1>
          <div className="flex items-center gap-2">
            <RarityBadge rarity={artifact.rarity} />
            <FavoriteButton itemId={artifact.itemId} isFavorite={artifact.isFavorite} disabled={!artifact.owned} />
          </div>
        </div>
      </div>

      <Card className="grid gap-6 p-5 md:grid-cols-2">
        <div className="aspect-square rounded-lg bg-slate-100">
          {artifact.owned && artifact.imageKey ? (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-100 to-rose-100 text-sm font-medium text-slate-500">
              {artifact.imageKey}
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-300">
              Hidden silhouette
            </div>
          )}
        </div>
        <div className="grid content-start gap-4">
          <p className="leading-7 text-[var(--muted)]">{artifact.owned ? artifact.description : artifact.hintText}</p>
          <dl className="grid gap-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--muted)]">Quantity</dt>
              <dd className="font-medium">{artifact.quantity}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--muted)]">First Found</dt>
              <dd className="font-medium">
                {artifact.firstFoundAt ? new Date(artifact.firstFoundAt).toLocaleDateString() : "Unknown"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--muted)]">Last Found</dt>
              <dd className="font-medium">
                {artifact.lastFoundAt ? new Date(artifact.lastFoundAt).toLocaleDateString() : "Unknown"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--muted)]">XP Earned</dt>
              <dd className="font-medium">{artifact.xpEarned}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--muted)]">Category</dt>
              <dd className="font-medium">{artifact.categoryName}</dd>
            </div>
          </dl>
        </div>
      </Card>
      <TimelineCard timeline={timeline} />
    </div>
  );
}
