export type Coordinates = {
  latitude: number;
  longitude: number;
};

const earthRadiusMeters = 6_371_000;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function isValidLatitude(latitude: number) {
  return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90;
}

export function isValidLongitude(longitude: number) {
  return Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
}

export function isValidAccuracy(accuracy: number) {
  return Number.isFinite(accuracy) && accuracy > 0;
}

export function haversineDistanceMeters(from: Coordinates, to: Coordinates) {
  const latDelta = toRadians(to.latitude - from.latitude);
  const lonDelta = toRadians(to.longitude - from.longitude);
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);

  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lonDelta / 2) ** 2;
  const c = 2 * Math.asin(Math.min(1, Math.sqrt(a)));

  return earthRadiusMeters * c;
}

export function calculateTravelSpeedKmh(distanceMeters: number, elapsedMs: number) {
  if (!Number.isFinite(distanceMeters) || !Number.isFinite(elapsedMs) || elapsedMs <= 0) {
    return null;
  }

  return distanceMeters / 1000 / (elapsedMs / 3_600_000);
}

export function isWithinCooldown(lastVisitedAt: Date, now: Date, cooldownMinutes: number) {
  return now.getTime() - lastVisitedAt.getTime() < cooldownMinutes * 60_000;
}

export function isDailyLimitReached(count: number, limit: number) {
  return count >= limit;
}
