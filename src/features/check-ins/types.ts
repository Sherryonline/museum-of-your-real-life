import type { CheckInValidationStatus, RewardStatus } from "@/types/database";
import type { StructuredCheckInError } from "@/features/check-ins/errors";

export type NearbyLocation = {
  locationId: string;
  name: string;
  brandName: string | null;
  categoryCode: string;
  categoryName: string;
  categoryIcon: string;
  distanceM: number;
  checkInRadiusM: number;
  address: string;
  city: string;
  district: string;
  eligible: boolean;
};

export type CheckInResult = {
  checkInId: string | null;
  memoryId: string | null;
  validationStatus: CheckInValidationStatus;
  rewardStatus: RewardStatus;
  suspiciousFlag: boolean;
  message: string;
  error: StructuredCheckInError | null;
};

export type CheckInHistoryItem = {
  checkInId: string;
  validationStatus: CheckInValidationStatus;
  rewardStatus: RewardStatus;
  suspiciousFlag: boolean;
  serverTimestamp: string;
  calculatedDistanceM: number;
  locationName: string;
  categoryName: string;
  categoryIcon: string;
  memoryId: string | null;
};

export type CheckInDetail = CheckInHistoryItem & {
  locationAddress: string;
  memoryTitle: string | null;
  memoryNote: string | null;
  memoryVisibility: string | null;
};
