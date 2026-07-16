import type { ItemRarity } from "@/types/database";
import { cn } from "@/lib/utils";
import { formatRarity } from "@/features/rewards/utils";

const rarityTone: Record<ItemRarity, string> = {
  COMMON: "border-slate-200 bg-slate-50 text-slate-800",
  UNCOMMON: "border-emerald-200 bg-emerald-50 text-emerald-800",
  RARE: "border-blue-200 bg-blue-50 text-blue-800",
  EPIC: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800",
  LEGENDARY: "border-amber-200 bg-amber-50 text-amber-800",
};

export function RarityBadge({ rarity }: Readonly<{ rarity: ItemRarity }>) {
  return (
    <span className={cn("inline-flex rounded-md border px-2 py-1 text-xs font-medium", rarityTone[rarity])}>
      {formatRarity(rarity)}
    </span>
  );
}
