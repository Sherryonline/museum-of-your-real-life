import { InventoryClient } from "@/features/rewards/inventory-client";
import { getInventory } from "@/features/rewards/actions";
import { requireUser } from "@/lib/auth/guards";

export default async function InventoryPage() {
  await requireUser();
  const inventory = await getInventory();

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Inventory</h1>
        <p className="mt-2 text-[var(--muted)]">Items collected from valid check-in rewards.</p>
      </div>
      <InventoryClient inventory={inventory} />
    </div>
  );
}
