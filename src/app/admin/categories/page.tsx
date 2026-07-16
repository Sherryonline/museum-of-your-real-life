import { saveCategoryAction } from "@/features/admin/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth/guards";

const saveCategoryFormAction = saveCategoryAction as unknown as (formData: FormData) => Promise<void>;

export default async function AdminCategoriesPage() {
  const { supabase } = await requireAdmin();
  const { data: categoryRows } = await supabase
    .from("location_categories")
    .select("*")
    .order("name", { ascending: true });
  const categories = categoryRows ?? [];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Category management</h1>
        <p className="mt-2 text-[var(--muted)]">Create, edit, activate, and deactivate check-in categories.</p>
      </div>
      <Card className="p-5">
        <form action={saveCategoryFormAction} className="grid gap-3 md:grid-cols-6">
          <Input name="code" placeholder="CODE" required />
          <Input name="name" placeholder="Name" required />
          <Input name="icon" placeholder="Icon key" required />
          <Input name="chestName" placeholder="Chest name" required />
          <select name="status" className="h-10 rounded-md border border-[var(--border)] px-3 text-sm">
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
          <Button type="submit">Create category</Button>
        </form>
      </Card>
      <div className="grid gap-3">
        {categories.map((category) => (
          <Card key={category.id} className="p-4">
            <form action={saveCategoryFormAction} className="grid gap-3 md:grid-cols-7">
              <input type="hidden" name="id" value={category.id} />
              <Input name="code" defaultValue={category.code} required />
              <Input name="name" defaultValue={category.name} required />
              <Input name="icon" defaultValue={category.icon} required />
              <Input name="chestName" defaultValue={category.chest_name} required />
              <select
                name="status"
                defaultValue={category.status}
                className="h-10 rounded-md border border-[var(--border)] px-3 text-sm"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
              <p className="text-xs text-[var(--muted)]">
                Deactivation hides related active content from players; review locations/items first.
              </p>
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
