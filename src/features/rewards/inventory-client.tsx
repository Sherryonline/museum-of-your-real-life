"use client";

import { useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
import { RarityBadge } from "@/features/rewards/rarity-badge";
import type { InventorySummary } from "@/features/rewards/types";
import type { ItemRarity } from "@/types/database";

const rarities: Array<ItemRarity | "ALL"> = ["ALL", "COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"];

export function InventoryClient({ inventory }: Readonly<{ inventory: InventorySummary }>) {
  const [category, setCategory] = useState("ALL");
  const [rarity, setRarity] = useState<ItemRarity | "ALL">("ALL");
  const [owned, setOwned] = useState("OWNED");
  const categories = useMemo(
    () => ["ALL", ...Array.from(new Set(inventory.items.map((item) => item.categoryCode))).sort()],
    [inventory.items],
  );
  const filtered = inventory.items.filter((item) => {
    return (
      (category === "ALL" || item.categoryCode === category) &&
      (rarity === "ALL" || item.rarity === rarity) &&
      (owned === "ALL" || item.quantity > 0)
    );
  });

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-[var(--muted)]">Total XP</p>
          <p className="mt-2 text-2xl font-semibold">{inventory.totalXp}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-[var(--muted)]">Level</p>
          <p className="mt-2 text-2xl font-semibold">{inventory.level}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-[var(--muted)]">Title</p>
          <p className="mt-2 text-2xl font-semibold">{inventory.levelTitle}</p>
        </Card>
      </div>

      <Card className="grid gap-3 p-5 sm:grid-cols-3">
        <label className="grid gap-2 text-sm">
          Category
          <select className="focus-ring h-10 rounded-md border border-[var(--border)] bg-white px-3" value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          Rarity
          <select className="focus-ring h-10 rounded-md border border-[var(--border)] bg-white px-3" value={rarity} onChange={(event) => setRarity(event.target.value as ItemRarity | "ALL")}>
            {rarities.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          Ownership
          <select className="focus-ring h-10 rounded-md border border-[var(--border)] bg-white px-3" value={owned} onChange={(event) => setOwned(event.target.value)}>
            <option value="OWNED">Owned</option>
            <option value="ALL">All</option>
          </select>
        </label>
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-5 text-sm text-[var(--muted)]">Inventory is empty.</Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <Card className="p-5" key={item.inventoryId}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--accent)]">
                    {item.categoryName}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">{item.itemName}</h2>
                </div>
                <RarityBadge rarity={item.rarity} />
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{item.itemDescription}</p>
              <dl className="mt-4 grid gap-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[var(--muted)]">Quantity</dt>
                  <dd className="font-medium">{item.quantity}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--muted)]">First collected</dt>
                  <dd className="font-medium">{new Date(item.firstCollectedAt).toLocaleDateString()}</dd>
                </div>
              </dl>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
