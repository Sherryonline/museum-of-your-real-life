"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/features/collections/progress-bar";
import type { CollectionListItem } from "@/features/collections/types";

export function CollectionsClient({ collections }: Readonly<{ collections: CollectionListItem[] }>) {
  const [category, setCategory] = useState("ALL");
  const categories = useMemo(
    () => ["ALL", ...Array.from(new Set(collections.map((collection) => collection.categoryCode))).sort()],
    [collections],
  );
  const filtered = collections.filter(
    (collection) => category === "ALL" || collection.categoryCode === category,
  );

  return (
    <div className="grid gap-6">
      <Card className="p-5">
        <label className="grid max-w-xs gap-2 text-sm">
          Category
          <select
            className="focus-ring h-10 rounded-md border border-[var(--border)] bg-white px-3"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </Card>
      {filtered.length === 0 ? (
        <Card className="p-5 text-sm text-[var(--muted)]">No collections available.</Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((collection) => (
            <Link href={`/app/collections/${collection.collectionId}`} key={collection.collectionId}>
              <Card className="p-5 transition hover:bg-slate-50">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--accent)]">
                      {collection.categoryName}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold">{collection.name}</h2>
                  </div>
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium">
                    {collection.completionStatus === "COMPLETED" ? "Completed" : "In progress"}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{collection.description}</p>
                <div className="mt-4 grid gap-2">
                  <ProgressBar value={collection.progressPercentage} />
                  <p className="text-sm text-[var(--muted)]">
                    {collection.ownedUniqueItems}/{collection.requiredUniqueItems} unique items ·{" "}
                    {Math.round(collection.progressPercentage)}%
                  </p>
                </div>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  Completion reward: {collection.completionXp} XP
                  {collection.badgeName ? ` · ${collection.badgeName}` : ""}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
