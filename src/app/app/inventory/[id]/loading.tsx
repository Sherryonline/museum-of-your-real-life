import { Card } from "@/components/ui/card";

export default function ArtifactDetailLoading() {
  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <div className="h-8 w-64 animate-pulse rounded bg-slate-100" />
      <Card className="grid gap-6 p-5 md:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-lg bg-slate-100" />
        <div className="grid gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-8 animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      </Card>
    </div>
  );
}
