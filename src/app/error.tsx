"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-start justify-center gap-6 px-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--danger)]">Error</p>
        <h1 className="mt-2 text-3xl font-semibold">Something went wrong</h1>
        <p className="mt-3 text-[var(--muted)]">
          The app avoided exposing implementation details. Try again or return later.
        </p>
      </div>
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
