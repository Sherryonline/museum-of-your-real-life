import { CollectionsClient } from "@/features/collections/collections-client";
import { getCollections } from "@/features/collections/actions";
import { requireUser } from "@/lib/auth/guards";

export default async function CollectionsPage() {
  await requireUser();
  const collections = await getCollections();

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Collections</h1>
        <p className="mt-2 text-[var(--muted)]">Complete sets using unique owned reward items.</p>
      </div>
      <CollectionsClient collections={collections} />
    </div>
  );
}
