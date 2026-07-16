import { AppNav } from "@/components/layout/app-nav";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();

  return (
    <>
      <AppNav />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
    </>
  );
}
