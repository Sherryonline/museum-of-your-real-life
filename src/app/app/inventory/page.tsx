import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getInventoryDashboard, getInventoryListing } from "@/features/inventory/actions";
import {
  getDiscoveryProgress,
  getInventoryRecommendations,
  getInventoryStatistics,
} from "@/features/inventory/discovery-actions";
import {
  HighlightCard,
  RecommendationCard,
  StatisticsPanel,
} from "@/features/inventory/discovery-components";
import { inventoryQuerySchema } from "@/features/inventory/schemas";
import { InventoryDashboardView } from "@/features/inventory/inventory-dashboard";
import { InventoryGrid } from "@/features/inventory/inventory-grid";
import { requireUser } from "@/lib/auth/guards";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { supabase } = await requireUser();
  const params = await searchParams;
  const parsed = inventoryQuerySchema.parse({
    q: params.q,
    category: params.category || null,
    rarity: params.rarity || null,
    ownership: params.ownership,
    sort: params.sort,
    page: params.page,
  });
  const [{ data: categoryRows }, dashboard, listing, progress, recommendations, statistics] = await Promise.all([
    supabase.from("location_categories").select("id, name").eq("status", "ACTIVE").order("name"),
    getInventoryDashboard(),
    getInventoryListing(parsed),
    getDiscoveryProgress(),
    getInventoryRecommendations(),
    getInventoryStatistics(),
  ]);
  const highlight = dashboard.recentArtifacts[0];

  return (
    <div className="grid gap-8">
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Inventory</h1>
            <p className="mt-2 text-[var(--muted)]">Artifact discovery, favorites, and collection history.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/app/inventory/book">Open Artifact Book</Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <InventoryDashboardView dashboard={dashboard} />
        </div>
        <HighlightCard
          discoveredAt={highlight?.lastFoundAt ?? null}
          imageKey={highlight?.imageKey ?? null}
          name={highlight?.displayName ?? null}
          rarity={highlight?.rarity ?? null}
        />
      </div>
      <StatisticsPanel statistics={{ ...statistics, discoveryPercentage: progress.discoveryPercentage }} />
      <div className="grid gap-4 md:grid-cols-2">
        {recommendations.map((recommendation) => (
          <RecommendationCard key={recommendation.recommendationType} recommendation={recommendation} />
        ))}
      </div>
      <InventoryGrid listing={listing} categories={categoryRows ?? []} query={params} />
    </div>
  );
}
