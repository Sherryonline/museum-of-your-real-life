import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/features/collections/progress-bar";
import { getCollectionDetail } from "@/features/collections/actions";
import { RarityBadge } from "@/features/rewards/rarity-badge";
import { requireUser } from "@/lib/auth/guards";

export default async function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const collection = await getCollectionDetail(id);

  if (!collection) {
    notFound();
  }

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--accent)]">
          {collection.categoryName}
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{collection.name}</h1>
        <p className="mt-2 text-[var(--muted)]">{collection.description}</p>
      </div>
      <Card className="p-5">
        <div className="grid gap-3">
          <ProgressBar value={collection.progressPercentage} />
          <p className="text-sm text-[var(--muted)]">
            {collection.ownedUniqueItems}/{collection.requiredUniqueItems} unique items ·{" "}
            {Math.round(collection.progressPercentage)}%
          </p>
          <p className="text-sm text-[var(--muted)]">
            Reward: {collection.completionXp} XP
            {collection.badgeName ? ` · ${collection.badgeName}` : ""}
          </p>
          {collection.completedAt ? (
            <p className="text-sm font-medium">Completed {new Date(collection.completedAt).toLocaleString()}</p>
          ) : null}
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {collection.items.map((item) => (
          <Card className="p-5" key={item.itemId}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">{item.owned ? item.itemName : "Locked item"}</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {item.owned ? item.itemDescription : "Collect this reward item to reveal details."}
                </p>
              </div>
              <RarityBadge rarity={item.rarity} />
            </div>
            <p className="mt-4 text-sm text-[var(--muted)]">
              {item.owned ? `Owned · Quantity ${item.quantity}` : "Missing"}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
