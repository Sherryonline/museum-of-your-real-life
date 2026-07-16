import { saveBadgeAction } from "@/features/admin/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth/guards";

const ruleTypes = [
  "FIRST_MEMORY",
  "FIRST_CATEGORY_CHECKIN",
  "TOTAL_VALID_CHECKINS",
  "UNIQUE_LOCATIONS",
  "UNIQUE_CATEGORIES",
  "COLLECTION_COMPLETED",
  "WEEKEND_CHECKINS",
] as const;
const saveBadgeFormAction = saveBadgeAction as unknown as (formData: FormData) => Promise<void>;

export default async function AdminBadgesPage() {
  const { supabase } = await requireAdmin();
  const { data: badgeRows } = await supabase.from("badges").select("*").order("name");
  const badges = badgeRows ?? [];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Badge management</h1>
        <p className="mt-2 text-[var(--muted)]">Manage fixed supported rule types only. Rule value must be JSON.</p>
      </div>
      <Card className="p-5">
        <form action={saveBadgeFormAction} className="grid gap-3 md:grid-cols-4">
          <Input name="code" placeholder="CODE" required />
          <Input name="name" placeholder="Name" required />
          <Input name="iconKey" placeholder="Icon key" required />
          <select name="ruleType" className="h-10 rounded-md border px-3 text-sm">
            {ruleTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <Input name="description" placeholder="Description" required className="md:col-span-2" />
          <Input name="ruleValue" placeholder='{"count": 5}' defaultValue="{}" required />
          <select name="status" className="h-10 rounded-md border px-3 text-sm">
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
          <Button type="submit">Create badge</Button>
        </form>
      </Card>
      <div className="grid gap-3">
        {badges.map((badge) => (
          <Card key={badge.id} className="p-4">
            <form action={saveBadgeFormAction} className="grid gap-3 md:grid-cols-4">
              <input type="hidden" name="id" value={badge.id} />
              <Input name="code" defaultValue={badge.code} required />
              <Input name="name" defaultValue={badge.name} required />
              <Input name="iconKey" defaultValue={badge.icon_key} required />
              <select name="ruleType" defaultValue={badge.rule_type} className="h-10 rounded-md border px-3 text-sm">
                {ruleTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <Input name="description" defaultValue={badge.description} required className="md:col-span-2" />
              <Input name="ruleValue" defaultValue={JSON.stringify(badge.rule_value)} required />
              <select name="status" defaultValue={badge.status} className="h-10 rounded-md border px-3 text-sm">
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
