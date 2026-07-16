import { Landmark } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function PublicNav() {
  return (
    <header className="border-b border-[var(--border)] bg-white">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link className="flex items-center gap-2 text-sm font-semibold" href="/">
          <Landmark aria-hidden="true" className="h-5 w-5 text-[var(--accent)]" />
          Museum of Your Real Life
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">Register</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
