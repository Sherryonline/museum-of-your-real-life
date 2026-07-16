import type { ItemRarity } from "@/types/database";

export const rarityLabels: Record<ItemRarity, string> = {
  COMMON: "Common",
  UNCOMMON: "Uncommon",
  RARE: "Rare",
  EPIC: "Epic",
  LEGENDARY: "Legendary",
};

export function formatRarity(rarity: ItemRarity) {
  return rarityLabels[rarity];
}

export function calculateDuplicateXp(configuredValue: number | null | undefined) {
  return configuredValue && configuredValue > 0 ? configuredValue : 5;
}

export type WeightedOption<T> = {
  value: T;
  weight: number;
};

export function selectWeightedOption<T>(options: WeightedOption<T>[], roll: number) {
  const activeOptions = options.filter((option) => option.weight > 0);
  const totalWeight = activeOptions.reduce((sum, option) => sum + option.weight, 0);

  if (totalWeight <= 0) {
    return null;
  }

  const normalizedRoll = Math.max(0, Math.min(roll, totalWeight - Number.EPSILON));
  let cumulative = 0;

  for (const option of activeOptions) {
    cumulative += option.weight;
    if (normalizedRoll < cumulative) {
      return option.value;
    }
  }

  return activeOptions.at(-1)?.value ?? null;
}

export type LevelConfig = {
  level: number;
  requiredTotalXp: number;
  title: string;
};

export function calculateLevel(totalXp: number, levels: LevelConfig[]) {
  const sorted = [...levels].sort((a, b) => b.requiredTotalXp - a.requiredTotalXp);
  return (
    sorted.find((level) => level.requiredTotalXp <= totalXp) ?? {
      level: 1,
      requiredTotalXp: 0,
      title: "Visitor",
    }
  );
}
