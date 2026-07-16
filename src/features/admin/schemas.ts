import { z } from "zod";

export const adminStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);
export const lootTableStatusSchema = z.enum(["DRAFT", "ACTIVE", "INACTIVE"]);
export const feedbackStatusSchema = z.enum(["OPEN", "REVIEWED", "RESOLVED", "CLOSED"]);
export const badgeRuleTypeSchema = z.enum([
  "FIRST_MEMORY",
  "FIRST_CATEGORY_CHECKIN",
  "TOTAL_VALID_CHECKINS",
  "UNIQUE_LOCATIONS",
  "UNIQUE_CATEGORIES",
  "COLLECTION_COMPLETED",
  "WEEKEND_CHECKINS",
]);

export const allowedConfigurationKeys = [
  "NEARBY_RADIUS_M",
  "DEFAULT_CHECKIN_RADIUS_M",
  "MAX_GPS_ACCURACY_M",
  "SAME_LOCATION_COOLDOWN_MINUTES",
  "DAILY_REWARDED_CHECKIN_LIMIT",
  "DAILY_HARD_CHECKIN_LIMIT",
  "SUSPICIOUS_TRAVEL_SPEED_KMH",
  "DUPLICATE_ITEM_XP",
] as const;

export const configurationKeySchema = z.enum(allowedConfigurationKeys);

export const configurationValueSchema = z.object({
  key: configurationKeySchema,
  value: z.coerce.number(),
});

export const locationSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().trim().min(2).max(30).toUpperCase(),
  name: z.string().trim().min(2).max(150),
  brandName: z.string().trim().max(100).optional().nullable(),
  categoryId: z.string().uuid(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  address: z.string().trim().min(2).max(500),
  city: z.string().trim().min(1).max(100),
  district: z.string().trim().min(1).max(100),
  checkInRadiusM: z.coerce.number().int().min(1).max(100000),
  status: adminStatusSchema.default("ACTIVE"),
});

export const categorySchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().trim().min(2).max(30).toUpperCase(),
  name: z.string().trim().min(2).max(100),
  icon: z.string().trim().min(1).max(50),
  chestName: z.string().trim().min(2).max(100),
  status: adminStatusSchema.default("ACTIVE"),
});

export const itemSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().trim().min(2).max(80).toUpperCase(),
  categoryId: z.string().uuid(),
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().min(2).max(1000),
  rarity: z.enum(["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"]),
  imageKey: z.string().trim().min(1).max(120),
  baseXp: z.coerce.number().int().min(1).max(100000),
  status: adminStatusSchema.default("ACTIVE"),
});

export const lootTableSchema = z
  .object({
    id: z.string().uuid().optional(),
    code: z.string().trim().min(2).max(80).toUpperCase(),
    categoryId: z.string().uuid(),
    name: z.string().trim().min(2).max(150),
    version: z.coerce.number().int().min(1).max(100000),
    effectiveFrom: z.string().datetime({ offset: true }),
    effectiveTo: z.string().datetime({ offset: true }).optional().nullable(),
    status: lootTableStatusSchema.default("DRAFT"),
  })
  .refine((value) => !value.effectiveTo || Date.parse(value.effectiveTo) > Date.parse(value.effectiveFrom), {
    message: "Effective end must be after effective start.",
    path: ["effectiveTo"],
  });

export const lootTableItemSchema = z.object({
  lootTableId: z.string().uuid(),
  itemId: z.string().uuid(),
  weight: z.coerce.number().int().min(1).max(100000),
  status: adminStatusSchema.default("ACTIVE"),
});

export const collectionSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().trim().min(2).max(80).toUpperCase(),
  categoryId: z.string().uuid(),
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().min(2).max(1000),
  completionXp: z.coerce.number().int().min(0).max(100000),
  badgeId: z.string().uuid().optional().nullable(),
  displayOrder: z.coerce.number().int().min(0).max(100000),
  status: adminStatusSchema.default("ACTIVE"),
});

export const collectionItemSchema = z.object({
  collectionId: z.string().uuid(),
  itemId: z.string().uuid(),
  displayOrder: z.coerce.number().int().min(0).max(100000),
});

export const badgeSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().trim().min(2).max(80).toUpperCase(),
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().min(2).max(1000),
  iconKey: z.string().trim().min(1).max(120),
  ruleType: badgeRuleTypeSchema,
  ruleValue: z.string().trim().default("{}"),
  status: adminStatusSchema.default("ACTIVE"),
});

export const betaFeedbackSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  category: z.enum(["BUG", "IDEA", "CONFUSING", "PRAISE", "OTHER"]),
  message: z.string().trim().min(5).max(2000),
  screenshotUrl: z.string().trim().url().optional().or(z.literal("")).nullable(),
});

export const checkInReviewSchema = z.object({
  checkInId: z.string().uuid(),
  validationStatus: z.enum(["VALID", "REJECTED", "SUSPICIOUS"]),
  suspiciousFlag: z.coerce.boolean(),
  suspiciousReason: z.string().trim().max(200).optional().nullable(),
  rewardStatus: z.enum(["NOT_APPLICABLE", "PENDING", "GRANTED", "BLOCKED"]),
});

export function parseBadgeRuleValue(ruleType: z.infer<typeof badgeRuleTypeSchema>, raw: string) {
  let value: unknown;

  try {
    value = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error("Rule value must be valid JSON.");
  }

  const objectValue = z.record(z.string(), z.unknown()).parse(value);

  if (["TOTAL_VALID_CHECKINS", "UNIQUE_LOCATIONS", "UNIQUE_CATEGORIES"].includes(ruleType)) {
    z.coerce.number().int().min(1).parse(objectValue.count);
  }

  if (ruleType === "FIRST_CATEGORY_CHECKIN") {
    z.string().min(1).parse(objectValue.category_code);
  }

  return objectValue;
}

export function validateConfigurationValue(key: z.infer<typeof configurationKeySchema>, value: number) {
  if (["NEARBY_RADIUS_M", "DEFAULT_CHECKIN_RADIUS_M", "MAX_GPS_ACCURACY_M"].includes(key)) {
    return value >= 1 && value <= 100000;
  }

  if (
    [
      "SAME_LOCATION_COOLDOWN_MINUTES",
      "DAILY_REWARDED_CHECKIN_LIMIT",
      "DAILY_HARD_CHECKIN_LIMIT",
      "DUPLICATE_ITEM_XP",
    ].includes(key)
  ) {
    return Number.isInteger(value) && value >= 0 && value <= 10000;
  }

  if (key === "SUSPICIOUS_TRAVEL_SPEED_KMH") {
    return value >= 1 && value <= 1200;
  }

  return false;
}

export function calculateLootPercentages<T extends { weight: number }>(items: T[]) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);

  return items.map((item) => ({
    ...item,
    percentage: total > 0 ? Number(((item.weight / total) * 100).toFixed(2)) : 0,
  }));
}

export function effectivePeriodsOverlap(
  first: { from: Date; to: Date | null },
  second: { from: Date; to: Date | null },
) {
  const firstTo = first.to?.getTime() ?? Number.POSITIVE_INFINITY;
  const secondTo = second.to?.getTime() ?? Number.POSITIVE_INFINITY;

  return first.from.getTime() < secondTo && second.from.getTime() < firstTo;
}
