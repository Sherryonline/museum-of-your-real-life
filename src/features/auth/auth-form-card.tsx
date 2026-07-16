import { Card } from "@/components/ui/card";

export function AuthFormCard({
  children,
  description,
  title,
}: Readonly<{ children: React.ReactNode; description: string; title: string }>) {
  return (
    <Card className="p-6">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p>
      </div>
      <div className="mt-6">{children}</div>
    </Card>
  );
}
