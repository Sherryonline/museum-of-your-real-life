import { Card } from "@/components/ui/card";
import type { InventoryDashboard } from "@/features/inventory/types";
import { RarityBadge } from "@/features/rewards/rarity-badge";

export function InventoryDashboardView({ dashboard }: Readonly<{ dashboard: InventoryDashboard }>) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="p-4">
          <p className="text-sm text-[var(--muted)]">Discovery</p>
          <p className="mt-2 text-2xl font-semibold">{dashboard.discoveryPercentage}%</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-[var(--muted)]">Artifacts</p>
          <p className="mt-2 text-2xl font-semibold">
            {dashboard.ownedUniqueItems}/{dashboard.totalItems}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-[var(--muted)]">Total quantity</p>
          <p className="mt-2 text-2xl font-semibold">{dashboard.totalQuantity}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-[var(--muted)]">Inventory XP</p>
          <p className="mt-2 text-2xl font-semibold">{dashboard.totalXp}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-[var(--muted)]">Favorites</p>
          <p className="mt-2 text-2xl font-semibold">{dashboard.favoriteCount}/20</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="font-semibold">Recent Artifacts</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {dashboard.recentArtifacts.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Open chests to discover artifacts.</p>
            ) : (
              dashboard.recentArtifacts.map((item) => (
                <div key={item.itemId} className="rounded-md border border-[var(--border)] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{item.displayName}</p>
                    <RarityBadge rarity={item.rarity} />
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {item.categoryName} · Qty {item.quantity}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">Statistics</h2>
          <div className="mt-4 grid gap-3">
            {dashboard.rarityCounts.map((row) => (
              <div key={row.rarity} className="flex items-center justify-between text-sm">
                <RarityBadge rarity={row.rarity} />
                <span className="text-[var(--muted)]">
                  {row.ownedUniqueItems}/{row.totalItems}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold">Category Progress</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {dashboard.categoryProgress.map((category) => (
            <div key={category.categoryId} className="rounded-md border border-[var(--border)] p-3">
              <div className="flex justify-between gap-3 text-sm">
                <span className="font-medium">{category.categoryName}</span>
                <span className="text-[var(--muted)]">{category.discoveryPercentage}%</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-[var(--accent)]"
                  style={{ width: `${Math.min(category.discoveryPercentage, 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-[var(--muted)]">
                {category.ownedUniqueItems}/{category.totalItems} discovered
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
