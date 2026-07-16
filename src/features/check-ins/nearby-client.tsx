"use client";

import { LocateFixed, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getNearbyLocationsAction,
  submitCheckInAction,
} from "@/features/check-ins/actions";
import type { CheckInResult, NearbyLocation } from "@/features/check-ins/types";

type GeoState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "denied"; message: string }
  | { status: "unavailable"; message: string }
  | { status: "ready"; latitude: number; longitude: number; accuracy: number };

function formatMeters(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)} km`;
  }

  return `${Math.round(value)} m`;
}

function getGeoErrorMessage(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) {
    return "Location permission was denied.";
  }

  if (error.code === error.TIMEOUT) {
    return "Location request timed out.";
  }

  return "Location is unavailable on this device.";
}

export function NearbyClient() {
  const [geo, setGeo] = useState<GeoState>({ status: "idle" });
  const [locations, setLocations] = useState<NearbyLocation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [checkingInLocationId, setCheckingInLocationId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function requestLocation() {
    setError(null);
    setResult(null);

    if (!("geolocation" in navigator)) {
      setGeo({ status: "unavailable", message: "Geolocation is not supported by this browser." });
      return;
    }

    setGeo({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextGeo = {
          status: "ready" as const,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setGeo(nextGeo);

        startTransition(async () => {
          const nearbyResult = await getNearbyLocationsAction(nextGeo);
          setLocations(nearbyResult.data);
          setError(nearbyResult.error);
        });
      },
      (geoError) => {
        const message = getGeoErrorMessage(geoError);
        setGeo({
          status: geoError.code === geoError.PERMISSION_DENIED ? "denied" : "unavailable",
          message,
        });
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10_000 },
    );
  }

  function submitCheckIn(locationId: string) {
    if (geo.status !== "ready") {
      setError("Location access is required before checking in.");
      return;
    }

    setResult(null);
    setCheckingInLocationId(locationId);
    startTransition(async () => {
      const checkInResult = await submitCheckInAction({
        locationId,
        latitude: geo.latitude,
        longitude: geo.longitude,
        accuracy: geo.accuracy,
        clientTimestamp: new Date().toISOString(),
        idempotencyKey: crypto.randomUUID(),
      });
      setResult(checkInResult);
      setCheckingInLocationId(null);
    });
  }

  return (
    <div className="grid gap-6">
      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Location access</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Location is requested only when you press the button.
            </p>
          </div>
          <Button onClick={requestLocation} disabled={geo.status === "loading" || isPending}>
            {geo.status === "ready" ? (
              <RefreshCcw aria-hidden="true" className="h-4 w-4" />
            ) : (
              <LocateFixed aria-hidden="true" className="h-4 w-4" />
            )}
            {geo.status === "ready" ? "Refresh location" : "Use my location"}
          </Button>
        </div>
        <div className="mt-4">
          {geo.status === "loading" ? <Alert>Getting your current location...</Alert> : null}
          {geo.status === "denied" || geo.status === "unavailable" ? (
            <Alert tone="danger">{geo.message}</Alert>
          ) : null}
          {geo.status === "ready" ? (
            <Alert>GPS accuracy: {formatMeters(geo.accuracy)}</Alert>
          ) : null}
        </div>
      </Card>

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {result ? (
        <Alert tone={result.validationStatus === "VALID" ? "success" : result.validationStatus === "SUSPICIOUS" ? "default" : "danger"}>
          {result.message}{" "}
          {result.checkInId ? (
            <Link className="font-medium underline" href={`/app/check-ins/${result.checkInId}`}>
              View result
            </Link>
          ) : null}
        </Alert>
      ) : null}

      <section className="grid gap-4">
        <div>
          <h2 className="text-xl font-semibold">Nearby locations</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Active locations are calculated server-side and sorted by distance.
          </p>
        </div>
        {locations.length === 0 ? (
          <Card className="p-5 text-sm text-[var(--muted)]">
            Grant location access to load eligible nearby development seed locations.
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {locations.map((location) => (
              <Card className="p-5" key={location.locationId}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--accent)]">
                      {location.categoryName}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">{location.name}</h3>
                    {location.brandName ? (
                      <p className="mt-1 text-sm text-[var(--muted)]">{location.brandName}</p>
                    ) : null}
                  </div>
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-sm">
                    {formatMeters(location.distanceM)}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{location.address}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="text-sm text-[var(--muted)]">
                    Radius {formatMeters(location.checkInRadiusM)}
                  </span>
                  <Button
                    disabled={!location.eligible || checkingInLocationId === location.locationId || isPending}
                    onClick={() => submitCheckIn(location.locationId)}
                    size="sm"
                  >
                    Check in
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
