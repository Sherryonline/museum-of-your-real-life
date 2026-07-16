import Link from "next/link";
import { LockKeyhole } from "lucide-react";

import { Card } from "@/components/ui/card";
import { RarityBadge } from "@/features/rewards/rarity-badge";
import { FavoriteButton } from "@/features/inventory/favorite-button";
import type { InventoryArtifactCard } from "@/features/inventory/types";

export function ArtifactCard({ item }: Readonly<{ item: InventoryArtifactCard }>) {
  return (
    <Card className="grid gap-4 p-4">
      <div className="aspect-square overflow-hidden rounded-lg bg-slate-100">
        {item.owned && item.imageKey ? (
          <div
            aria-label={`${item.displayName} image placeholder`}
            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-100 to-rose-100 text-xs font-medium text-slate-500"
          >
            {item.imageKey}
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-300">
            <LockKeyhole className="h-10 w-10 opacity-70" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="grid gap-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{item.categoryName}</p>
            <h2 className="mt-1 font-semibold">{item.displayName}</h2>
          </div>
          <RarityBadge rarity={item.rarity} />
        </div>
        <p className="min-h-10 text-sm leading-6 text-[var(--muted)]">
          {item.owned ? item.description : item.hintText}
        </p>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-[var(--muted)]">Qty {item.quantity}</span>
          <span className="text-[var(--muted)]">
            {item.lastFoundAt ? `Last ${new Date(item.lastFoundAt).toLocaleDateString()}` : "Not discovered"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <Link className="text-sm font-medium text-[var(--accent)] underline" href={`/app/inventory/${item.itemId}`}>
            View detail
          </Link>
          <FavoriteButton itemId={item.itemId} isFavorite={item.isFavorite} disabled={!item.owned} />
        </div>
      </div>
    </Card>
  );
}
