import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-start justify-center gap-6 px-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--accent)]">404</p>
        <h1 className="mt-2 text-3xl font-semibold">Page not found</h1>
        <p className="mt-3 text-[var(--muted)]">This route is not part of the current sprint.</p>
      </div>
      <Button asChild>
        <Link href="/">Go home</Link>
      </Button>
    </main>
  );
}
