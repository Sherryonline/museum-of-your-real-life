import { ArrowRight, LockKeyhole, UserRound } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main>
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl content-center gap-10 px-6 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--accent)]">Private beta</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
            Museum of Your Real Life
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--muted)]">
            A personal archive for memories that deserve structure, care, and clear ownership.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/register">
                Create account <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/login">Log in</Link>
            </Button>
          </div>
        </div>
        <div className="rounded-md border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <LockKeyhole className="mt-1 h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
              <div>
                <h2 className="font-medium">Private by default</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  Sprint 0 establishes authentication, row-level security, and protected routes first.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <UserRound className="mt-1 h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
              <div>
                <h2 className="font-medium">Profile foundation</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  Users can manage their profile fields while system and role fields stay locked down.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
