import { PublicNav } from "@/components/layout/public-nav";

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <PublicNav />
      {children}
    </>
  );
}
