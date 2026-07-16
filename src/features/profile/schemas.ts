import { z } from "zod";

export const profileSchema = z.object({
  displayName: z.string().trim().min(2, "Display name must be at least 2 characters").max(50),
  avatarKey: z.string().trim().min(1).max(50),
  museumVisibility: z.enum(["PRIVATE", "PUBLIC"]),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export const profileUpdateSchema = profileSchema;
export type ProfileUpdateInput = ProfileInput;
