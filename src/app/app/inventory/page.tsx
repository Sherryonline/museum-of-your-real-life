import { getInventoryDashboard, getInventoryListing } from "@/features/inventory/actions";
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
  const [{ data: categoryRows }, dashboard, listing] = await Promise.all([
    supabase.from("location_categories").select("id, name").eq("status", "ACTIVE").order("name"),
    getInventoryDashboard(),
    getInventoryListing(parsed),
  ]);

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-semibold">Inventory</h1>
        <p className="mt-2 text-[var(--muted)]">Artifact discovery, favorites, and collection history.</p>
      </div>
      <InventoryDashboardView dashboard={dashboard} />
      <InventoryGrid listing={listing} categories={categoryRows ?? []} query={params} />
    </div>
  );
}
