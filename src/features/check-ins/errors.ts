export const checkInErrorMessages = {
  CHECKIN_LOCATION_NOT_FOUND: "The selected location is not available.",
  CHECKIN_LOCATION_INACTIVE: "The selected location is not active.",
  CHECKIN_GPS_REQUIRED: "Location access is required before checking in.",
  CHECKIN_GPS_INACCURATE: "GPS accuracy is too low. Move to a clearer location and retry.",
  CHECKIN_OUT_OF_RANGE: "You are not close enough to this location.",
  CHECKIN_COOLDOWN: "This location was checked in recently. Try again later.",
  CHECKIN_HARD_DAILY_LIMIT: "Daily check-in limit reached. Try again tomorrow.",
  CHECKIN_SUSPICIOUS_TRAVEL: "Check-in recorded for review.",
  CHECKIN_ALREADY_PROCESSED: "This check-in request was already processed.",
  CHECKIN_INVALID_REQUEST: "The check-in request is invalid.",
  CHECKIN_INTERNAL_ERROR: "Check-in failed. Try again later.",
} as const;

export type CheckInErrorCode = keyof typeof checkInErrorMessages;

export type StructuredCheckInError = {
  code: CheckInErrorCode;
  message: string;
  retryAfterSeconds?: number;
  correlationId?: string;
};

export function isCheckInErrorCode(value: string | null | undefined): value is CheckInErrorCode {
  return Boolean(value && value in checkInErrorMessages);
}

export function mapCheckInError(
  code: string | null | undefined,
  retryAfterSeconds?: number | null,
): StructuredCheckInError | null {
  if (!isCheckInErrorCode(code)) {
    return null;
  }

  return {
    code,
    message: checkInErrorMessages[code],
    retryAfterSeconds: retryAfterSeconds ?? undefined,
  };
}

export function internalCheckInError(correlationId: string): StructuredCheckInError {
  return {
    code: "CHECKIN_INTERNAL_ERROR",
    message: checkInErrorMessages.CHECKIN_INTERNAL_ERROR,
    correlationId,
  };
}
