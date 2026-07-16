import { z } from "zod";

export const inventoryOwnershipSchema = z.enum(["OWNED", "UNOWNED", "ALL", "FAVORITES"]);
export const inventorySortSchema = z.enum(["RECENT", "FIRST_FOUND", "NAME_ASC", "RARITY_DESC", "QUANTITY_DESC"]);
export const inventoryRarityFilterSchema = z.enum(["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"]).nullable();

export const inventoryQuerySchema = z.object({
  q: z.string().trim().max(80).optional().default(""),
  category: z.string().uuid().optional().nullable(),
  rarity: inventoryRarityFilterSchema.optional().default(null),
  ownership: inventoryOwnershipSchema.optional().default("OWNED"),
  sort: inventorySortSchema.optional().default("RECENT"),
  page: z.coerce.number().int().min(1).optional().default(1),
});

export type InventoryQuery = z.infer<typeof inventoryQuerySchema>;
