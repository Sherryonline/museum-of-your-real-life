import { NearbyClient } from "@/features/check-ins/nearby-client";

export default function NearbyPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Nearby</h1>
        <p className="mt-2 text-[var(--muted)]">Find active development locations and submit a check-in.</p>
      </div>
      <NearbyClient />
    </div>
  );
}
