import { Card } from "@/components/ui/card";

export default function InventoryLoading() {
  return (
    <div className="grid gap-6">
      <div className="h-8 w-40 animate-pulse rounded bg-slate-100" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} className="h-24 animate-pulse bg-slate-50" />
        ))}
      </div>
      <Card className="h-40 animate-pulse bg-slate-50" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="h-80 animate-pulse bg-slate-50" />
        ))}
      </div>
    </div>
  );
}
