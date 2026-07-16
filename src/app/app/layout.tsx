import { AppNav } from "@/components/layout/app-nav";
import { requireUser } from "@/lib/auth/guards";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireUser();

  return (
    <>
      <AppNav />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
    </>
  );
}
