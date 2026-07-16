import { saveCollectionAction, saveCollectionItemAction } from "@/features/admin/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth/guards";

const saveCollectionFormAction = saveCollectionAction as unknown as (formData: FormData) => Promise<void>;
const saveCollectionItemFormAction = saveCollectionItemAction as unknown as (formData: FormData) => Promise<void>;

export default async function AdminCollectionsPage() {
  const { supabase } = await requireAdmin();
  const [{ data: categoryRows }, { data: badgeRows }, { data: itemRows }, { data: collectionRows }] =
    await Promise.all([
      supabase.from("location_categories").select("id, name").order("name"),
      supabase.from("badges").select("id, name").order("name"),
      supabase.from("items").select("id, name, category_id").eq("status", "ACTIVE").order("name"),
      supabase.from("collections").select("*").order("display_order"),
    ]);
  const categories = categoryRows ?? [];
  const badges = badgeRows ?? [];
  const items = itemRows ?? [];
  const collections = collectionRows ?? [];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Collection management</h1>
        <p className="mt-2 text-[var(--muted)]">Create collections, assign items, completion XP, and optional badges.</p>
      </div>
      <Card className="p-5">
        <form action={saveCollectionFormAction} className="grid gap-3 md:grid-cols-4">
          <Input name="code" placeholder="CODE" required />
          <select name="categoryId" className="h-10 rounded-md border px-3 text-sm" required>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <Input name="name" placeholder="Name" required />
          <Input name="completionXp" placeholder="Completion XP" defaultValue="100" required />
          <Input name="description" placeholder="Description" required className="md:col-span-2" />
          <select name="badgeId" className="h-10 rounded-md border px-3 text-sm">
            <option value="">No badge</option>
            {badges.map((badge) => (
              <option key={badge.id} value={badge.id}>
                {badge.name}
              </option>
            ))}
          </select>
          <Input name="displayOrder" defaultValue="0" required />
          <select name="status" className="h-10 rounded-md border px-3 text-sm">
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
          <Button type="submit">Create collection</Button>
        </form>
      </Card>
      <div className="grid gap-4">
        {collections.map((collection) => {
          const eligibleItems = items.filter((item) => item.category_id === collection.category_id);
          return (
            <Card key={collection.id} className="grid gap-4 p-4">
              <form action={saveCollectionFormAction} className="grid gap-3 md:grid-cols-4">
                <input type="hidden" name="id" value={collection.id} />
                <Input name="code" defaultValue={collection.code} required />
                <select name="categoryId" defaultValue={collection.category_id} className="h-10 rounded-md border px-3 text-sm">
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <Input name="name" defaultValue={collection.name} required />
                <Input name="completionXp" defaultValue={String(collection.completion_xp)} required />
                <Input name="description" defaultValue={collection.description} required className="md:col-span-2" />
                <select name="badgeId" defaultValue={collection.badge_id ?? ""} className="h-10 rounded-md border px-3 text-sm">
                  <option value="">No badge</option>
                  {badges.map((badge) => (
                    <option key={badge.id} value={badge.id}>
                      {badge.name}
                    </option>
                  ))}
                </select>
                <Input name="displayOrder" defaultValue={String(collection.display_order)} required />
                <select name="status" defaultValue={collection.status} className="h-10 rounded-md border px-3 text-sm">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
                <Button type="submit" variant="outline">
                  Save
                </Button>
              </form>
              <form action={saveCollectionItemFormAction} className="grid gap-3 md:grid-cols-3">
                <input type="hidden" name="collectionId" value={collection.id} />
                <select name="itemId" className="h-10 rounded-md border px-3 text-sm">
                  {eligibleItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <Input name="displayOrder" defaultValue="0" required />
                <Button type="submit" variant="outline">
                  Assign matching item
                </Button>
              </form>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
