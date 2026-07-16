import Link from "next/link";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-10">
      <div className="w-full max-w-md">
        <Link className="mb-6 inline-block text-sm font-semibold text-[var(--accent)]" href="/">
          Museum of Your Real Life
        </Link>
        {children}
      </div>
    </main>
  );
}
