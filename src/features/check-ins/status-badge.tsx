import type { CheckInValidationStatus } from "@/types/database";
import { cn } from "@/lib/utils";

const toneByStatus: Record<CheckInValidationStatus, string> = {
  VALID: "border-emerald-200 bg-emerald-50 text-emerald-800",
  REJECTED: "border-red-200 bg-red-50 text-red-800",
  SUSPICIOUS: "border-amber-200 bg-amber-50 text-amber-800",
};

export function StatusBadge({ status }: Readonly<{ status: CheckInValidationStatus }>) {
  return (
    <span className={cn("inline-flex rounded-md border px-2 py-1 text-xs font-medium", toneByStatus[status])}>
      {status}
    </span>
  );
}
