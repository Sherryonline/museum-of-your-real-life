import { submitBetaFeedbackAction } from "@/features/admin/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const submitBetaFeedbackFormAction = submitBetaFeedbackAction as unknown as (formData: FormData) => Promise<void>;

export default function FeedbackPage() {
  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Beta feedback</h1>
        <p className="mt-2 text-[var(--muted)]">Send a bug report, idea, or usability note to the admin team.</p>
      </div>
      <Card className="p-5">
        <form action={submitBetaFeedbackFormAction} className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            Rating
            <select name="rating" defaultValue="5" className="h-10 rounded-md border px-3 text-sm">
              <option value="5">5 - Great</option>
              <option value="4">4 - Good</option>
              <option value="3">3 - OK</option>
              <option value="2">2 - Poor</option>
              <option value="1">1 - Blocked</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Category
            <select name="category" className="h-10 rounded-md border px-3 text-sm">
              <option value="BUG">Bug</option>
              <option value="IDEA">Idea</option>
              <option value="CONFUSING">Confusing</option>
              <option value="PRAISE">Praise</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Message
            <textarea
              name="message"
              required
              minLength={5}
              maxLength={2000}
              className="min-h-32 rounded-md border border-[var(--border)] p-3 text-sm"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Screenshot URL optional
            <Input name="screenshotUrl" placeholder="https://..." />
          </label>
          <Button type="submit">Submit feedback</Button>
        </form>
      </Card>
    </div>
  );
}
