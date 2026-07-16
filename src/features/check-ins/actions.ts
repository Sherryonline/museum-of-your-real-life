"use server";

import { headers } from "next/headers";

import { internalCheckInError, mapCheckInError } from "@/features/check-ins/errors";
import { checkInRequestSchema, nearbyRequestSchema } from "@/features/check-ins/schemas";
import type {
  CheckInDetail,
  CheckInHistoryItem,
  CheckInResult,
  NearbyLocation,
} from "@/features/check-ins/types";
import { createClient } from "@/lib/supabase/server";

async function getCorrelationId() {
  const headerStore = await headers();
  return headerStore.get("x-request-id") ?? crypto.randomUUID();
}

export async function getNearbyLocationsAction(input: unknown): Promise<{
  data: NearbyLocation[];
  error: string | null;
}> {
  const parsed = nearbyRequestSchema.safeParse(input);

  if (!parsed.success) {
    return { data: [], error: "Location coordinates are invalid." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: [], error: "Sign in is required before viewing nearby locations." };
  }

  const { data, error } = await supabase.rpc("get_nearby_locations", {
    p_latitude: parsed.data.latitude,
    p_longitude: parsed.data.longitude,
    p_radius_m: parsed.data.radius ?? null,
  });

  if (error) {
    return { data: [], error: "Nearby locations could not be loaded." };
  }

  return {
    data: (data ?? []).map((location) => ({
      locationId: location.location_id,
      name: location.name,
      brandName: location.brand_name,
      categoryCode: location.category_code,
      categoryName: location.category_name,
      categoryIcon: location.category_icon,
      distanceM: Number(location.distance_m),
      checkInRadiusM: location.check_in_radius_m,
      address: location.address,
      city: location.city,
      district: location.district,
      eligible: location.eligible,
    })),
    error: null,
  };
}

export async function submitCheckInAction(input: unknown): Promise<CheckInResult> {
  const parsed = checkInRequestSchema.safeParse(input);

  if (!parsed.success) {
    return {
      checkInId: null,
      memoryId: null,
      validationStatus: "REJECTED",
      rewardStatus: "NOT_APPLICABLE",
      suspiciousFlag: false,
      message: "The check-in request is invalid.",
      error: mapCheckInError("CHECKIN_INVALID_REQUEST"),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      checkInId: null,
      memoryId: null,
      validationStatus: "REJECTED",
      rewardStatus: "NOT_APPLICABLE",
      suspiciousFlag: false,
      message: "Sign in is required before checking in.",
      error: mapCheckInError("CHECKIN_GPS_REQUIRED"),
    };
  }

  const { data, error } = await supabase.rpc("process_check_in", {
    p_location_id: parsed.data.locationId,
    p_latitude: parsed.data.latitude,
    p_longitude: parsed.data.longitude,
    p_accuracy_m: parsed.data.accuracy,
    p_client_timestamp: parsed.data.clientTimestamp,
    p_idempotency_key: parsed.data.idempotencyKey,
  });

  if (error || !data?.[0]) {
    const correlationId = await getCorrelationId();
    return {
      checkInId: null,
      memoryId: null,
      validationStatus: "REJECTED",
      rewardStatus: "NOT_APPLICABLE",
      suspiciousFlag: false,
      message: "Check-in failed. Try again later.",
      error: internalCheckInError(correlationId),
    };
  }

  const result = data[0];
  const mappedError = mapCheckInError(result.error_code, result.retry_after_seconds);

  return {
    checkInId: result.check_in_id,
    memoryId: result.memory_id,
    validationStatus: result.validation_status,
    rewardStatus: result.reward_status,
    suspiciousFlag: result.suspicious_flag,
    message: mappedError?.message ?? result.user_message,
    error: mappedError,
  };
}

export async function getCheckInHistory(): Promise<CheckInHistoryItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_check_in_history");

  if (error) {
    return [];
  }

  return (data ?? []).map((item) => ({
    checkInId: item.check_in_id,
    validationStatus: item.validation_status,
    rewardStatus: item.reward_status,
    suspiciousFlag: item.suspicious_flag,
    serverTimestamp: item.server_timestamp,
    calculatedDistanceM: Number(item.calculated_distance_m),
    locationName: item.location_name,
    categoryName: item.category_name,
    categoryIcon: item.category_icon,
    memoryId: item.memory_id,
  }));
}

export async function getCheckInDetail(checkInId: string): Promise<CheckInDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_check_in_detail", { p_check_in_id: checkInId });

  if (error || !data?.[0]) {
    return null;
  }

  const item = data[0];

  return {
    checkInId: item.check_in_id,
    validationStatus: item.validation_status,
    rewardStatus: item.reward_status,
    suspiciousFlag: item.suspicious_flag,
    serverTimestamp: item.server_timestamp,
    calculatedDistanceM: Number(item.calculated_distance_m),
    locationName: item.location_name,
    locationAddress: item.location_address,
    categoryName: item.category_name,
    categoryIcon: item.category_icon,
    memoryId: item.memory_id,
    memoryTitle: item.memory_title,
    memoryNote: item.memory_note,
    memoryVisibility: item.memory_visibility,
  };
}
