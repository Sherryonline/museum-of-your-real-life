import { saveItemAction } from "@/features/admin/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth/guards";

const rarities = ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"] as const;
const saveItemFormAction = saveItemAction as unknown as (formData: FormData) => Promise<void>;

export default async function AdminItemsPage() {
  const { supabase } = await requireAdmin();
  const [{ data: categoryRows }, { data: itemRows }] = await Promise.all([
    supabase.from("location_categories").select("id, name").order("name"),
    supabase.from("items").select("*").order("updated_at", { ascending: false }).limit(80),
  ]);
  const categories = categoryRows ?? [];
  const items = itemRows ?? [];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Item management</h1>
        <p className="mt-2 text-[var(--muted)]">Create, edit, activate, and deactivate reward items.</p>
      </div>
      <Card className="p-5">
        <form action={saveItemFormAction} className="grid gap-3 md:grid-cols-4">
          <Input name="code" placeholder="CODE" required />
          <select name="categoryId" className="h-10 rounded-md border px-3 text-sm" required>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <Input name="name" placeholder="Name" required />
          <select name="rarity" className="h-10 rounded-md border px-3 text-sm">
            {rarities.map((rarity) => (
              <option key={rarity} value={rarity}>
                {rarity}
              </option>
            ))}
          </select>
          <Input name="imageKey" placeholder="Image key" required />
          <Input name="baseXp" placeholder="Base XP" defaultValue="10" required />
          <Input name="description" placeholder="Description" required className="md:col-span-2" />
          <select name="status" className="h-10 rounded-md border px-3 text-sm">
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
          <Button type="submit">Create item</Button>
        </form>
      </Card>
      <div className="grid gap-3">
        {items.map((item) => (
          <Card key={item.id} className="p-4">
            <form action={saveItemFormAction} className="grid gap-3 md:grid-cols-4">
              <input type="hidden" name="id" value={item.id} />
              <Input name="code" defaultValue={item.code} required />
              <select name="categoryId" defaultValue={item.category_id} className="h-10 rounded-md border px-3 text-sm">
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <Input name="name" defaultValue={item.name} required />
              <select name="rarity" defaultValue={item.rarity} className="h-10 rounded-md border px-3 text-sm">
                {rarities.map((rarity) => (
                  <option key={rarity} value={rarity}>
                    {rarity}
                  </option>
                ))}
              </select>
              <Input name="imageKey" defaultValue={item.image_key} required />
              <Input name="baseXp" defaultValue={String(item.base_xp)} required />
              <Input name="description" defaultValue={item.description} required className="md:col-span-2" />
              <select name="status" defaultValue={item.status} className="h-10 rounded-md border px-3 text-sm">
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
              <Button type="submit" variant="outline">
                Save
              </Button>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
