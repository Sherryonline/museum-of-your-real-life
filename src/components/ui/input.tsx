import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "focus-ring h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
