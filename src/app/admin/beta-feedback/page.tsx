import { updateFeedbackStatusAction } from "@/features/admin/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/guards";

const updateFeedbackStatusFormAction = updateFeedbackStatusAction as unknown as (formData: FormData) => Promise<void>;

export default async function AdminBetaFeedbackPage() {
  const { supabase } = await requireAdmin();
  const { data: feedbackRows } = await supabase
    .from("beta_feedback")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  const feedback = feedbackRows ?? [];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Beta feedback</h1>
        <p className="mt-2 text-[var(--muted)]">Review player feedback and update triage status.</p>
      </div>
      <div className="grid gap-3">
        {feedback.map((item) => (
          <Card key={item.id} className="grid gap-3 p-4">
            <div>
              <p className="font-medium">
                {item.category} · {item.rating}/5
              </p>
              <p className="text-sm text-[var(--muted)]">
                User {item.user_id.slice(0, 8)}… · {new Date(item.created_at).toLocaleString()}
              </p>
              <p className="mt-3 whitespace-pre-wrap">{item.message}</p>
              {item.screenshot_url ? (
                <a className="mt-2 block text-sm text-[var(--accent)] underline" href={item.screenshot_url}>
                  Screenshot
                </a>
              ) : null}
            </div>
            <form action={updateFeedbackStatusFormAction} className="flex gap-3">
              <input type="hidden" name="id" value={item.id} />
              <select name="status" defaultValue={item.status} className="h-10 rounded-md border px-3 text-sm">
                <option value="OPEN">OPEN</option>
                <option value="REVIEWED">REVIEWED</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
              <Button type="submit" variant="outline">
                Update status
              </Button>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
