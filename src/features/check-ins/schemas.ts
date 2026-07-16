import { z } from "zod";

export const coordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive(),
});

export const nearbyRequestSchema = coordinateSchema.extend({
  radius: z.number().int().positive().optional(),
});

export const checkInRequestSchema = z.object({
  locationId: z.uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive(),
  clientTimestamp: z.iso.datetime(),
  idempotencyKey: z.uuid(),
});

export type NearbyRequestInput = z.infer<typeof nearbyRequestSchema>;
export type CheckInRequestInput = z.infer<typeof checkInRequestSchema>;
