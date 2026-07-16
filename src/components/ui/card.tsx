import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-md border border-[var(--border)] bg-[var(--panel)] shadow-sm", className)}
      {...props}
    />
  );
}
