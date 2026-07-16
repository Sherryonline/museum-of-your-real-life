import Link from "next/link";
import { LockKeyhole, Sparkles } from "lucide-react";

import { Card } from "@/components/ui/card";
import type {
  ArtifactBookItem,
  ArtifactTimelineItem,
  CategoryProgress,
  DiscoveryProgress,
  InventoryRecommendation,
  InventoryStatistics,
} from "@/features/inventory/discovery-types";
import { RarityBadge } from "@/features/rewards/rarity-badge";

export function UnknownArtifactCard({ item }: Readonly<{ item: ArtifactBookItem }>) {
  return (
    <Card className="grid gap-3 p-4">
      <div className="flex aspect-square items-center justify-center rounded-lg bg-slate-950 text-slate-300">
        <LockKeyhole className="h-10 w-10" aria-hidden="true" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{item.categoryName}</p>
        <p className="mt-1 text-sm font-medium">???</p>
        <h2 className="text-lg font-semibold">Unknown Artifact</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">{item.hintText}</p>
      </div>
    </Card>
  );
}

export function ArtifactBookCard({ item }: Readonly<{ item: ArtifactBookItem }>) {
  if (item.artifactState !== "COLLECTED") {
    return <UnknownArtifactCard item={item} />;
  }

  return (
    <Card className="grid gap-3 p-4">
      <div className="flex aspect-square items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-rose-100 text-xs font-medium text-slate-500">
        {item.imageKey}
      </div>
      <div>
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{item.categoryName}</p>
          {item.displayRarity ? <RarityBadge rarity={item.displayRarity} /> : null}
        </div>
        <h2 className="mt-2 text-lg font-semibold">{item.displayName}</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">Quantity {item.quantity}</p>
        <p className="text-sm text-[var(--muted)]">
          Discovered {item.discoveryDate ? new Date(item.discoveryDate).toLocaleDateString() : "Unknown"}
        </p>
        <Link className="mt-3 inline-flex text-sm font-medium text-[var(--accent)] underline" href={`/app/inventory/${item.itemId}`}>
          Open timeline
        </Link>
      </div>
    </Card>
  );
}

export function ArtifactBookGrid({ items }: Readonly<{ items: ArtifactBookItem[] }>) {
  if (items.length === 0) {
    return <Card className="p-8 text-center text-sm text-[var(--muted)]">No artifacts found.</Card>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <ArtifactBookCard item={item} key={item.itemId} />
      ))}
    </div>
  );
}

export function DiscoveryProgressCard({ progress }: Readonly<{ progress: DiscoveryProgress }>) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--muted)]">Overall Discovery</p>
          <p className="mt-1 text-3xl font-semibold">
            {progress.ownedUniqueItems} / {progress.totalItems}
          </p>
        </div>
        <p className="text-2xl font-semibold text-[var(--accent)]">{progress.discoveryPercentage}%</p>
      </div>
      <div className="mt-4 h-3 rounded-full bg-slate-100">
        <div className="h-3 rounded-full bg-[var(--accent)]" style={{ width: `${Math.min(progress.discoveryPercentage, 100)}%` }} />
      </div>
    </Card>
  );
}

export function CategoryProgressCard({ category }: Readonly<{ category: CategoryProgress }>) {
  return (
    <Card className="p-4">
      <div className="flex justify-between gap-3">
        <p className="font-medium">{category.category_name}</p>
        <p className="text-sm text-[var(--muted)]">{category.discovery_percentage}%</p>
      </div>
      <div className="mt-3 h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-[var(--accent)]" style={{ width: `${Math.min(category.discovery_percentage, 100)}%` }} />
      </div>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {category.owned_unique_items} / {category.total_items}
      </p>
    </Card>
  );
}

export function RecommendationCard({ recommendation }: Readonly<{ recommendation: InventoryRecommendation }>) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--accent)]">{recommendation.recommendationType.replaceAll("_", " ")}</p>
      <h3 className="mt-2 font-semibold">{recommendation.categoryName} Collection</h3>
      <p className="mt-2 text-sm text-[var(--muted)]">{recommendation.message}</p>
      <p className="mt-3 text-sm font-medium">
        {recommendation.ownedUniqueItems} / {recommendation.totalItems} · {recommendation.remainingItems} remaining
      </p>
    </Card>
  );
}

export function TimelineCard({ timeline }: Readonly<{ timeline: ArtifactTimelineItem[] }>) {
  return (
    <Card className="p-5">
      <h2 className="font-semibold">Discovery Timeline</h2>
      <div className="mt-4 grid gap-3">
        {timeline.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No discovery timeline yet.</p>
        ) : (
          timeline.map((entry) => (
            <div className="rounded-md border border-[var(--border)] p-3" key={entry.checkInId}>
              <p className="font-medium">{entry.locationName}</p>
              <p className="text-sm text-[var(--muted)]">{new Date(entry.visitDate).toLocaleDateString()}</p>
              {entry.memoryTitle ? <p className="mt-1 text-sm">{entry.memoryTitle}</p> : null}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

export function HighlightCard({
  name,
  rarity,
  discoveredAt,
  imageKey,
}: Readonly<{ name: string | null; rarity: string | null; discoveredAt: string | null; imageKey: string | null }>) {
  return (
    <Card className="overflow-hidden p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
        <h2 className="font-semibold">Today&apos;s Highlight</h2>
      </div>
      {name ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-[96px_1fr]">
          <div className="flex aspect-square items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-rose-100 text-xs text-slate-500">
            {imageKey}
          </div>
          <div>
            <p className="text-lg font-semibold">{name}</p>
            <p className="text-sm text-[var(--muted)]">{rarity}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Discovered {discoveredAt ? new Date(discoveredAt).toLocaleString() : "recently"}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-[var(--muted)]">Open a chest to create today&apos;s highlight.</p>
      )}
    </Card>
  );
}

export function StatisticsPanel({ statistics }: Readonly<{ statistics: InventoryStatistics }>) {
  const rows = [
    ["Total Artifacts", statistics.totalArtifacts],
    ["Unique Artifacts", statistics.uniqueArtifacts],
    ["Duplicate Artifacts", statistics.duplicateArtifacts],
    ["Discovery %", `${statistics.discoveryPercentage}%`],
    ["Favorite Category", statistics.favoriteCategory ?? "None yet"],
    ["Most Collected", statistics.mostCollectedArtifact ?? "None yet"],
    ["Oldest Artifact", statistics.oldestArtifact ?? "None yet"],
    ["Newest Artifact", statistics.newestArtifact ?? "None yet"],
  ];

  return (
    <Card className="p-5">
      <h2 className="font-semibold">Inventory Statistics</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div className="rounded-md bg-slate-50 p-3" key={label}>
            <p className="text-xs text-[var(--muted)]">{label}</p>
            <p className="mt-1 font-semibold">{value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
