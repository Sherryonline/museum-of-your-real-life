import { cn } from "@/lib/utils";

export function Alert({
  className,
  tone = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { tone?: "default" | "danger" | "success" }) {
  return (
    <div
      className={cn(
        "rounded-md border px-4 py-3 text-sm",
        tone === "danger" && "border-red-200 bg-red-50 text-red-900",
        tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-900",
        tone === "default" && "border-slate-200 bg-slate-50 text-slate-800",
        className,
      )}
      role={tone === "danger" ? "alert" : "status"}
      {...props}
    />
  );
}
