"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  badgeSchema,
  betaFeedbackSchema,
  categorySchema,
  checkInReviewSchema,
  collectionItemSchema,
  collectionSchema,
  configurationValueSchema,
  itemSchema,
  locationSchema,
  lootTableItemSchema,
  lootTableSchema,
  parseBadgeRuleValue,
  validateConfigurationValue,
} from "@/features/admin/schemas";
import { requireAdmin, requireUser } from "@/lib/auth/guards";
import type { Json } from "@/types/database";

export type AdminActionResult = {
  ok: boolean;
  message: string;
  id?: string;
};

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function emptyToNull(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function mapError(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? "Input is invalid.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Operation failed.";
}

async function recordAudit(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  action: string,
  entityType: string,
  entityId: string | null,
  metadata: Json,
) {
  const { error } = await supabase.rpc("record_admin_audit", {
    p_action: action,
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_metadata: metadata,
  });

  if (error) {
    throw new Error("Audit log could not be recorded.");
  }
}

async function getBefore(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  table: string,
  id: string | undefined,
) {
  if (!id) return null;
  const { data } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
  return redactAuditValue(table, data) as Json;
}

function redactAuditValue(table: string, value: unknown) {
  if (!value || typeof value !== "object" || table !== "check_ins") {
    return value;
  }

  const redacted = { ...(value as Record<string, unknown>) };
  delete redacted.user_latitude;
  delete redacted.user_longitude;
  delete redacted.idempotency_key;
  return redacted;
}

export async function saveCategoryAction(formData: FormData): Promise<AdminActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const input = categorySchema.parse({
      id: formValue(formData, "id"),
      code: formData.get("code"),
      name: formData.get("name"),
      icon: formData.get("icon"),
      chestName: formData.get("chestName"),
      status: formData.get("status") ?? "ACTIVE",
    });
    const before = await getBefore(supabase, "location_categories", input.id);
    const payload = {
      code: input.code,
      name: input.name,
      icon: input.icon,
      chest_name: input.chestName,
      status: input.status,
    };
    const query = input.id
      ? supabase.from("location_categories").update(payload).eq("id", input.id).select("id").single()
      : supabase.from("location_categories").insert(payload).select("id").single();
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    await recordAudit(supabase, input.id ? "category.update" : "category.create", "location_category", data.id, {
      before,
      after: payload,
    });
    revalidatePath("/admin/categories");
    return { ok: true, message: "Category saved.", id: data.id };
  } catch (error) {
    return { ok: false, message: mapError(error) };
  }
}

export async function saveLocationAction(formData: FormData): Promise<AdminActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const input = locationSchema.parse({
      id: formValue(formData, "id"),
      code: formData.get("code"),
      name: formData.get("name"),
      brandName: emptyToNull(formData.get("brandName")),
      categoryId: formData.get("categoryId"),
      latitude: formData.get("latitude"),
      longitude: formData.get("longitude"),
      address: formData.get("address"),
      city: formData.get("city"),
      district: formData.get("district"),
      checkInRadiusM: formData.get("checkInRadiusM"),
      status: formData.get("status") ?? "ACTIVE",
    });
    const before = await getBefore(supabase, "locations", input.id);
    const payload = {
      code: input.code,
      name: input.name,
      brand_name: input.brandName,
      category_id: input.categoryId,
      latitude: input.latitude,
      longitude: input.longitude,
      address: input.address,
      city: input.city,
      district: input.district,
      check_in_radius_m: input.checkInRadiusM,
      status: input.status,
    };
    const query = input.id
      ? supabase.from("locations").update(payload).eq("id", input.id).select("id").single()
      : supabase.from("locations").insert(payload).select("id").single();
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    await recordAudit(supabase, input.id ? "location.update" : "location.create", "location", data.id, {
      before,
      after: payload,
    });
    revalidatePath("/admin/locations");
    return { ok: true, message: "Location saved.", id: data.id };
  } catch (error) {
    return { ok: false, message: mapError(error) };
  }
}

export async function saveItemAction(formData: FormData): Promise<AdminActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const input = itemSchema.parse({
      id: formValue(formData, "id"),
      code: formData.get("code"),
      categoryId: formData.get("categoryId"),
      name: formData.get("name"),
      description: formData.get("description"),
      rarity: formData.get("rarity"),
      imageKey: formData.get("imageKey"),
      baseXp: formData.get("baseXp"),
      status: formData.get("status") ?? "ACTIVE",
    });
    const before = await getBefore(supabase, "items", input.id);
    const payload = {
      code: input.code,
      category_id: input.categoryId,
      name: input.name,
      description: input.description,
      rarity: input.rarity,
      image_key: input.imageKey,
      base_xp: input.baseXp,
      status: input.status,
    };
    const query = input.id
      ? supabase.from("items").update(payload).eq("id", input.id).select("id").single()
      : supabase.from("items").insert(payload).select("id").single();
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    await recordAudit(supabase, input.id ? "item.update" : "item.create", "item", data.id, { before, after: payload });
    revalidatePath("/admin/items");
    return { ok: true, message: "Item saved.", id: data.id };
  } catch (error) {
    return { ok: false, message: mapError(error) };
  }
}

export async function saveLootTableAction(formData: FormData): Promise<AdminActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const input = lootTableSchema.parse({
      id: formValue(formData, "id"),
      code: formData.get("code"),
      categoryId: formData.get("categoryId"),
      name: formData.get("name"),
      version: formData.get("version"),
      effectiveFrom: formData.get("effectiveFrom"),
      effectiveTo: emptyToNull(formData.get("effectiveTo")),
      status: formData.get("status") ?? "DRAFT",
    });
    const before = await getBefore(supabase, "loot_tables", input.id);
    const payload = {
      code: input.code,
      category_id: input.categoryId,
      name: input.name,
      version: input.version,
      effective_from: input.effectiveFrom,
      effective_to: input.effectiveTo,
      status: input.status,
    };
    const query = input.id
      ? supabase.from("loot_tables").update(payload).eq("id", input.id).select("id").single()
      : supabase.from("loot_tables").insert(payload).select("id").single();
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    await recordAudit(supabase, input.id ? "loot_table.update" : "loot_table.create", "loot_table", data.id, {
      before,
      after: payload,
    });
    revalidatePath("/admin/loot-tables");
    return { ok: true, message: "Loot table saved.", id: data.id };
  } catch (error) {
    return { ok: false, message: mapError(error) };
  }
}

export async function saveLootTableItemAction(formData: FormData): Promise<AdminActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const input = lootTableItemSchema.parse({
      lootTableId: formData.get("lootTableId"),
      itemId: formData.get("itemId"),
      weight: formData.get("weight"),
      status: formData.get("status") ?? "ACTIVE",
    });
    const { data: lootTable } = await supabase
      .from("loot_tables")
      .select("category_id")
      .eq("id", input.lootTableId)
      .single();
    const { data: item } = await supabase.from("items").select("category_id").eq("id", input.itemId).single();
    if (!lootTable || !item || lootTable.category_id !== item.category_id) {
      throw new Error("Loot table item category mismatch.");
    }
    const payload = {
      loot_table_id: input.lootTableId,
      item_id: input.itemId,
      weight: input.weight,
      status: input.status,
    };
    const { data, error } = await supabase
      .from("loot_table_items")
      .upsert(payload, { onConflict: "loot_table_id,item_id" })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await recordAudit(supabase, "loot_table_item.upsert", "loot_table_item", data.id, { after: payload });
    revalidatePath("/admin/loot-tables");
    return { ok: true, message: "Loot table item saved.", id: data.id };
  } catch (error) {
    return { ok: false, message: mapError(error) };
  }
}

export async function saveCollectionAction(formData: FormData): Promise<AdminActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const input = collectionSchema.parse({
      id: formValue(formData, "id"),
      code: formData.get("code"),
      categoryId: formData.get("categoryId"),
      name: formData.get("name"),
      description: formData.get("description"),
      completionXp: formData.get("completionXp"),
      badgeId: emptyToNull(formData.get("badgeId")),
      displayOrder: formData.get("displayOrder") ?? "0",
      status: formData.get("status") ?? "ACTIVE",
    });
    const before = await getBefore(supabase, "collections", input.id);
    const payload = {
      code: input.code,
      category_id: input.categoryId,
      name: input.name,
      description: input.description,
      completion_xp: input.completionXp,
      badge_id: input.badgeId,
      display_order: input.displayOrder,
      status: input.status,
    };
    const query = input.id
      ? supabase.from("collections").update(payload).eq("id", input.id).select("id").single()
      : supabase.from("collections").insert(payload).select("id").single();
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    await recordAudit(supabase, input.id ? "collection.update" : "collection.create", "collection", data.id, {
      before,
      after: payload,
    });
    revalidatePath("/admin/collections");
    return { ok: true, message: "Collection saved.", id: data.id };
  } catch (error) {
    return { ok: false, message: mapError(error) };
  }
}

export async function saveCollectionItemAction(formData: FormData): Promise<AdminActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const input = collectionItemSchema.parse({
      collectionId: formData.get("collectionId"),
      itemId: formData.get("itemId"),
      displayOrder: formData.get("displayOrder") ?? "0",
    });
    const payload = {
      collection_id: input.collectionId,
      item_id: input.itemId,
      display_order: input.displayOrder,
    };
    const { error } = await supabase.from("collection_items").upsert(payload, {
      onConflict: "collection_id,item_id",
    });
    if (error) throw new Error(error.message);
    await recordAudit(supabase, "collection_item.upsert", "collection_item", input.collectionId, { after: payload });
    revalidatePath("/admin/collections");
    return { ok: true, message: "Collection item saved.", id: input.collectionId };
  } catch (error) {
    return { ok: false, message: mapError(error) };
  }
}

export async function saveBadgeAction(formData: FormData): Promise<AdminActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const parsed = badgeSchema.parse({
      id: formValue(formData, "id"),
      code: formData.get("code"),
      name: formData.get("name"),
      description: formData.get("description"),
      iconKey: formData.get("iconKey"),
      ruleType: formData.get("ruleType"),
      ruleValue: formData.get("ruleValue") ?? "{}",
      status: formData.get("status") ?? "ACTIVE",
    });
    const ruleValue = parseBadgeRuleValue(parsed.ruleType, parsed.ruleValue) as Json;
    const before = await getBefore(supabase, "badges", parsed.id);
    const payload = {
      code: parsed.code,
      name: parsed.name,
      description: parsed.description,
      icon_key: parsed.iconKey,
      rule_type: parsed.ruleType,
      rule_value: ruleValue,
      status: parsed.status,
    };
    const query = parsed.id
      ? supabase.from("badges").update(payload).eq("id", parsed.id).select("id").single()
      : supabase.from("badges").insert(payload).select("id").single();
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    await recordAudit(supabase, parsed.id ? "badge.update" : "badge.create", "badge", data.id, { before, after: payload });
    revalidatePath("/admin/badges");
    return { ok: true, message: "Badge saved.", id: data.id };
  } catch (error) {
    return { ok: false, message: mapError(error) };
  }
}

export async function updateConfigurationAction(formData: FormData): Promise<AdminActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const input = configurationValueSchema.parse({
      key: formData.get("key"),
      value: formData.get("value"),
    });
    if (!validateConfigurationValue(input.key, input.value)) {
      throw new Error("Configuration value is outside the approved range.");
    }
    const { data: before } = await supabase
      .from("app_configurations")
      .select("*")
      .eq("config_key", input.key)
      .maybeSingle();
    const payload = { config_value: { value: input.value }, status: "ACTIVE" as const };
    const { data, error } = await supabase
      .from("app_configurations")
      .update(payload)
      .eq("config_key", input.key)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await recordAudit(supabase, "configuration.update", "app_configuration", data.id, { before, after: payload });
    revalidatePath("/admin/configuration");
    return { ok: true, message: "Configuration updated.", id: data.id };
  } catch (error) {
    return { ok: false, message: mapError(error) };
  }
}

export async function reviewCheckInAction(formData: FormData): Promise<AdminActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const input = checkInReviewSchema.parse({
      checkInId: formData.get("checkInId"),
      validationStatus: formData.get("validationStatus"),
      suspiciousFlag: formData.get("suspiciousFlag") === "true",
      suspiciousReason: emptyToNull(formData.get("suspiciousReason")),
      rewardStatus: formData.get("rewardStatus"),
    });
    const before = await getBefore(supabase, "check_ins", input.checkInId);
    const payload = {
      validation_status: input.validationStatus,
      suspicious_flag: input.suspiciousFlag,
      suspicious_reason: input.suspiciousReason,
      reward_status: input.rewardStatus,
    };
    const { error } = await supabase.from("check_ins").update(payload).eq("id", input.checkInId);
    if (error) throw new Error(error.message);
    await recordAudit(supabase, "check_in.review", "check_in", input.checkInId, { before, after: payload });
    revalidatePath("/admin/check-ins");
    return { ok: true, message: "Check-in reviewed.", id: input.checkInId };
  } catch (error) {
    return { ok: false, message: mapError(error) };
  }
}

export async function submitBetaFeedbackAction(formData: FormData): Promise<AdminActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const input = betaFeedbackSchema.parse({
      rating: formData.get("rating"),
      category: formData.get("category"),
      message: formData.get("message"),
      screenshotUrl: emptyToNull(formData.get("screenshotUrl")),
    });
    const { data, error } = await supabase
      .from("beta_feedback")
      .insert({
        user_id: user.id,
        rating: input.rating,
        category: input.category,
        message: input.message,
        screenshot_url: input.screenshotUrl || null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, message: "Feedback submitted.", id: data.id };
  } catch (error) {
    return { ok: false, message: mapError(error) };
  }
}

export async function updateFeedbackStatusAction(formData: FormData): Promise<AdminActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const id = z.string().uuid().parse(formData.get("id"));
    const status = z.enum(["OPEN", "REVIEWED", "RESOLVED", "CLOSED"]).parse(formData.get("status"));
    const before = await getBefore(supabase, "beta_feedback", id);
    const { error } = await supabase.from("beta_feedback").update({ status }).eq("id", id);
    if (error) throw new Error(error.message);
    await recordAudit(supabase, "beta_feedback.update_status", "beta_feedback", id, { before, after: { status } });
    revalidatePath("/admin/beta-feedback");
    return { ok: true, message: "Feedback status updated.", id };
  } catch (error) {
    return { ok: false, message: mapError(error) };
  }
}
