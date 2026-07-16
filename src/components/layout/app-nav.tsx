"use client";

import {
  Archive,
  Award,
  FolderKanban,
  History,
  LogOut,
  MapPin,
  MessageSquare,
  Settings,
  Shield,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getClientErrorMessage } from "@/lib/errors/client-message";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const links = [
  { href: "/app", label: "Home", icon: UserRound },
  { href: "/app/nearby", label: "Nearby", icon: MapPin },
  { href: "/app/check-ins", label: "Check-ins", icon: History },
  { href: "/app/inventory", label: "Inventory", icon: Archive },
  { href: "/app/collections", label: "Collections", icon: FolderKanban },
  { href: "/app/badges", label: "Badges", icon: Award },
  { href: "/app/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/app/profile", label: "Profile", icon: UserRound },
  { href: "/app/settings", label: "Settings", icon: Settings },
  { href: "/admin", label: "Admin", icon: Shield },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut().catch((caughtError: unknown) => ({
      error: new Error(getClientErrorMessage(caughtError, "Sign out failed.")),
    }));

    if (error) {
      window.alert(error.message);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-[var(--border)] bg-white">
      <nav className="mx-auto flex min-h-16 max-w-6xl flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Link className="text-sm font-semibold" href="/app">
          Museum of Your Real Life
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;

            return (
              <Link
                className={cn(
                  "focus-ring inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm",
                  active ? "bg-slate-100 text-slate-950" : "text-slate-700 hover:bg-slate-50",
                )}
                href={link.href}
                key={link.href}
              >
                <Icon aria-hidden="true" className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
          <Button aria-label="Sign out" onClick={signOut} size="icon" type="button" variant="outline">
            <LogOut aria-hidden="true" className="h-4 w-4" />
          </Button>
        </div>
      </nav>
    </header>
  );
}
