import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getArtifactBook, getDiscoveryProgress } from "@/features/inventory/discovery-actions";
import {
  ArtifactBookGrid,
  CategoryProgressCard,
  DiscoveryProgressCard,
} from "@/features/inventory/discovery-components";
import { requireUser } from "@/lib/auth/guards";

export default async function ArtifactBookPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const { supabase } = await requireUser();
  const params = await searchParams;
  const page = Math.max(Number(params.page ?? "1") || 1, 1);
  const [{ data: categories }, book, progress] = await Promise.all([
    supabase.from("location_categories").select("id, name").eq("status", "ACTIVE").order("name"),
    getArtifactBook({ categoryId: params.category || null, page }),
    getDiscoveryProgress(),
  ]);
  const baseQuery = new URLSearchParams();
  if (params.category) baseQuery.set("category", params.category);
  const previous = new URLSearchParams(baseQuery);
  previous.set("page", String(Math.max(page - 1, 1)));
  const next = new URLSearchParams(baseQuery);
  next.set("page", String(page + 1));

  return (
    <div className="grid gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Artifact Book</h1>
          <p className="mt-2 text-[var(--muted)]">Discover every active artifact without revealing unknown details.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/app/inventory">Back to inventory</Link>
        </Button>
      </div>

      <DiscoveryProgressCard progress={progress} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {progress.categoryProgress.map((category) => (
          <CategoryProgressCard key={category.category_id} category={category} />
        ))}
      </div>

      <form className="grid gap-3 rounded-md border border-[var(--border)] bg-white p-4 sm:grid-cols-[1fr_auto]">
        <select name="category" defaultValue={params.category ?? ""} className="h-10 rounded-md border px-3 text-sm">
          <option value="">All categories</option>
          {(categories ?? []).map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <Button type="submit">Filter book</Button>
      </form>

      <ArtifactBookGrid items={book.items} />

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted)]">
          Page {book.page} of {Math.max(book.totalPages, 1)} · {book.totalCount} artifacts
        </p>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/app/inventory/book?${previous.toString()}`}>Previous</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/app/inventory/book?${next.toString()}`}>Next</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
