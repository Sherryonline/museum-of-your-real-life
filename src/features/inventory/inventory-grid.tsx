import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArtifactCard } from "@/features/inventory/artifact-card";
import type { InventoryListing } from "@/features/inventory/types";

const rarities = ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"] as const;

export function InventoryGrid({
  listing,
  categories,
  query,
}: Readonly<{
  listing: InventoryListing;
  categories: Array<{ id: string; name: string }>;
  query: Record<string, string | undefined>;
}>) {
  const page = Number(query.page ?? "1");
  const baseQuery = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value && key !== "page") baseQuery.set(key, value);
  }
  const previous = new URLSearchParams(baseQuery);
  previous.set("page", String(Math.max(page - 1, 1)));
  const next = new URLSearchParams(baseQuery);
  next.set("page", String(page + 1));

  return (
    <div className="grid gap-6">
      <Card className="p-5">
        <form className="grid gap-3 md:grid-cols-6">
          <Input name="q" placeholder="Search owned artifacts" defaultValue={query.q ?? ""} className="md:col-span-2" />
          <select name="category" defaultValue={query.category ?? ""} className="h-10 rounded-md border px-3 text-sm">
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select name="rarity" defaultValue={query.rarity ?? ""} className="h-10 rounded-md border px-3 text-sm">
            <option value="">All rarities</option>
            {rarities.map((rarity) => (
              <option key={rarity} value={rarity}>
                {rarity}
              </option>
            ))}
          </select>
          <select name="ownership" defaultValue={query.ownership ?? "OWNED"} className="h-10 rounded-md border px-3 text-sm">
            <option value="OWNED">Owned</option>
            <option value="UNOWNED">Unknown</option>
            <option value="ALL">All</option>
            <option value="FAVORITES">Favorites</option>
          </select>
          <select name="sort" defaultValue={query.sort ?? "RECENT"} className="h-10 rounded-md border px-3 text-sm">
            <option value="RECENT">Recently found</option>
            <option value="FIRST_FOUND">First found</option>
            <option value="NAME_ASC">Name A-Z</option>
            <option value="RARITY_DESC">Rarity</option>
            <option value="QUANTITY_DESC">Quantity</option>
          </select>
          <Button type="submit" className="md:col-span-6">
            Apply filters
          </Button>
        </form>
      </Card>

      {listing.items.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[var(--muted)]">
          No artifacts match these filters. Try clearing search or changing ownership.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {listing.items.map((item) => (
            <ArtifactCard key={item.itemId} item={item} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted)]">
          Page {listing.page} of {Math.max(listing.totalPages, 1)} · {listing.totalCount} artifacts
        </p>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link aria-disabled={page <= 1} href={`/app/inventory?${previous.toString()}`}>
              Previous
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link aria-disabled={page >= listing.totalPages} href={`/app/inventory?${next.toString()}`}>
              Next
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
