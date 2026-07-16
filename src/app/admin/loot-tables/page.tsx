import { saveLootTableAction, saveLootTableItemAction } from "@/features/admin/actions";
import { calculateLootPercentages } from "@/features/admin/schemas";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth/guards";

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  return new Date(value).toISOString();
}

const saveLootTableFormAction = saveLootTableAction as unknown as (formData: FormData) => Promise<void>;
const saveLootTableItemFormAction = saveLootTableItemAction as unknown as (formData: FormData) => Promise<void>;

export default async function AdminLootTablesPage() {
  const { supabase } = await requireAdmin();
  const [{ data: categoryRows }, { data: itemRows }, { data: lootTableRows }, { data: lootItemRows }] =
    await Promise.all([
      supabase.from("location_categories").select("id, name").order("name"),
      supabase.from("items").select("id, name, category_id, rarity").eq("status", "ACTIVE").order("name"),
      supabase.from("loot_tables").select("*").order("created_at", { ascending: false }),
      supabase.from("loot_table_items").select("*").order("weight", { ascending: false }),
    ]);
  const categories = categoryRows ?? [];
  const items = itemRows ?? [];
  const lootTables = lootTableRows ?? [];
  const lootItems = lootItemRows ?? [];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Loot-table management</h1>
        <p className="mt-2 text-[var(--muted)]">
          Create draft versions, assign positive weights, show percentages, and activate effective periods.
        </p>
      </div>
      <Card className="p-5">
        <form action={saveLootTableFormAction} className="grid gap-3 md:grid-cols-4">
          <Input name="code" placeholder="CODE" required />
          <select name="categoryId" className="h-10 rounded-md border px-3 text-sm" required>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <Input name="name" placeholder="Name" required />
          <Input name="version" placeholder="Version" defaultValue="1" required />
          <Input name="effectiveFrom" placeholder="2026-01-01T00:00:00Z" required />
          <Input name="effectiveTo" placeholder="Optional end ISO date" />
          <select name="status" className="h-10 rounded-md border px-3 text-sm">
            <option value="DRAFT">DRAFT</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
          <Button type="submit">Create draft</Button>
        </form>
      </Card>
      <div className="grid gap-4">
        {lootTables.map((table) => {
          const tableItems = lootItems.filter((item) => item.loot_table_id === table.id);
          const withPercentages = calculateLootPercentages(tableItems.map((item) => ({ ...item, weight: item.weight })));
          const eligibleItems = items.filter((item) => item.category_id === table.category_id);
          return (
            <Card key={table.id} className="grid gap-4 p-4">
              <form action={saveLootTableFormAction} className="grid gap-3 md:grid-cols-4">
                <input type="hidden" name="id" value={table.id} />
                <Input name="code" defaultValue={table.code} required />
                <select name="categoryId" defaultValue={table.category_id} className="h-10 rounded-md border px-3 text-sm">
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <Input name="name" defaultValue={table.name} required />
                <Input name="version" defaultValue={String(table.version)} required />
                <Input name="effectiveFrom" defaultValue={toDatetimeLocal(table.effective_from)} required />
                <Input name="effectiveTo" defaultValue={toDatetimeLocal(table.effective_to)} />
                <select name="status" defaultValue={table.status} className="h-10 rounded-md border px-3 text-sm">
                  <option value="DRAFT">DRAFT</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
                <Button type="submit" variant="outline">
                  Save / activate
                </Button>
              </form>
              <div className="rounded-md bg-slate-50 p-3 text-sm">
                <p className="font-medium">Assigned items</p>
                <div className="mt-2 grid gap-1">
                  {withPercentages.map((item) => (
                    <p key={item.id} className="text-[var(--muted)]">
                      {items.find((candidate) => candidate.id === item.item_id)?.name ?? item.item_id} · weight{" "}
                      {item.weight} · {item.percentage}%
                    </p>
                  ))}
                  {withPercentages.length === 0 ? <p className="text-[var(--muted)]">No items assigned.</p> : null}
                </div>
              </div>
              <form action={saveLootTableItemFormAction} className="grid gap-3 md:grid-cols-4">
                <input type="hidden" name="lootTableId" value={table.id} />
                <select name="itemId" className="h-10 rounded-md border px-3 text-sm">
                  {eligibleItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} · {item.rarity}
                    </option>
                  ))}
                </select>
                <Input name="weight" placeholder="Positive weight" defaultValue="1" required />
                <select name="status" className="h-10 rounded-md border px-3 text-sm">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
                <Button type="submit" variant="outline">
                  Assign item
                </Button>
              </form>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
