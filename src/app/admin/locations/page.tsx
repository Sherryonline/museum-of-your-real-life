import { saveLocationAction } from "@/features/admin/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth/guards";

const saveLocationFormAction = saveLocationAction as unknown as (formData: FormData) => Promise<void>;

export default async function AdminLocationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; category?: string }>;
}) {
  const { q, status, category } = await searchParams;
  const { supabase } = await requireAdmin();
  const { data: categoryRows } = await supabase
    .from("location_categories")
    .select("id, code, name")
    .order("name");
  const categories = categoryRows ?? [];
  let query = supabase
    .from("locations")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(50);
  if (q) query = query.or(`name.ilike.%${q}%,code.ilike.%${q}%,city.ilike.%${q}%`);
  if (status === "ACTIVE" || status === "INACTIVE") query = query.eq("status", status);
  if (category) query = query.eq("category_id", category);
  const { data: locationRows } = await query;
  const locations = locationRows ?? [];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Location management</h1>
        <p className="mt-2 text-[var(--muted)]">Search, filter, create, edit, activate, and deactivate locations.</p>
      </div>
      <Card className="p-5">
        <form className="grid gap-3 md:grid-cols-4">
          <Input name="q" placeholder="Search name/code/city" defaultValue={q} />
          <select name="category" defaultValue={category ?? ""} className="h-10 rounded-md border px-3 text-sm">
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select name="status" defaultValue={status ?? ""} className="h-10 rounded-md border px-3 text-sm">
            <option value="">All statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
          <Button type="submit" variant="outline">
            Filter
          </Button>
        </form>
      </Card>
      <Card className="p-5">
        <form action={saveLocationFormAction} className="grid gap-3 md:grid-cols-4">
          <Input name="code" placeholder="CODE" required />
          <Input name="name" placeholder="Name" required />
          <Input name="brandName" placeholder="Brand (optional)" />
          <select name="categoryId" className="h-10 rounded-md border px-3 text-sm" required>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <Input name="latitude" placeholder="Latitude" required />
          <Input name="longitude" placeholder="Longitude" required />
          <Input name="checkInRadiusM" placeholder="Radius meters" defaultValue="150" required />
          <Input name="city" placeholder="City" required />
          <Input name="district" placeholder="District" required />
          <Input name="address" placeholder="Address" required className="md:col-span-2" />
          <select name="status" className="h-10 rounded-md border px-3 text-sm">
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
          <Button type="submit">Create location</Button>
        </form>
      </Card>
      <div className="grid gap-3">
        {locations.map((location) => (
          <Card key={location.id} className="p-4">
            <form action={saveLocationFormAction} className="grid gap-3 md:grid-cols-4">
              <input type="hidden" name="id" value={location.id} />
              <Input name="code" defaultValue={location.code} required />
              <Input name="name" defaultValue={location.name} required />
              <Input name="brandName" defaultValue={location.brand_name ?? ""} />
              <select
                name="categoryId"
                defaultValue={location.category_id}
                className="h-10 rounded-md border px-3 text-sm"
              >
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <Input name="latitude" defaultValue={String(location.latitude)} required />
              <Input name="longitude" defaultValue={String(location.longitude)} required />
              <Input name="checkInRadiusM" defaultValue={String(location.check_in_radius_m)} required />
              <Input name="city" defaultValue={location.city} required />
              <Input name="district" defaultValue={location.district} required />
              <Input name="address" defaultValue={location.address} required className="md:col-span-2" />
              <select name="status" defaultValue={location.status} className="h-10 rounded-md border px-3 text-sm">
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
