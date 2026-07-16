import { updateConfigurationAction } from "@/features/admin/actions";
import { allowedConfigurationKeys } from "@/features/admin/schemas";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth/guards";

const updateConfigurationFormAction = updateConfigurationAction as unknown as (formData: FormData) => Promise<void>;

export default async function AdminConfigurationPage() {
  const { supabase } = await requireAdmin();
  const { data: configRows } = await supabase.from("app_configurations").select("*").order("config_key");
  const configs = configRows ?? [];
  const allowed = configs.filter((config) => allowedConfigurationKeys.includes(config.config_key as never));

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Configuration management</h1>
        <p className="mt-2 text-[var(--muted)]">Only approved numeric configuration keys can be edited.</p>
      </div>
      <div className="grid gap-3">
        {allowed.map((config) => {
          const value =
            typeof config.config_value === "object" && config.config_value && "value" in config.config_value
              ? String(config.config_value.value)
              : "";
          return (
            <Card key={config.id} className="p-4">
              <form action={updateConfigurationFormAction} className="grid gap-3 md:grid-cols-4">
                <input type="hidden" name="key" value={config.config_key} />
                <div className="md:col-span-2">
                  <p className="font-medium">{config.config_key}</p>
                  <p className="text-sm text-[var(--muted)]">{config.description}</p>
                </div>
                <Input name="value" defaultValue={value} required />
                <Button type="submit" variant="outline">
                  Update
                </Button>
              </form>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
