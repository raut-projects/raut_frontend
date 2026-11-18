// Live ride monitoring service.
// Lists in-progress rides and issues operator actions (cancel, flag, note,
// escalate, fare override). Each call switches on LIVE_RIDES_USE_MOCK_DATA: mock
// helpers answer locally, otherwise the shared `./api` helpers call the backend.
// Backend failures surface as ApiError.

import { API_ROUTES } from "@/lib/config";
import { apiGet, apiPut, apiPost } from "./api";
import type {
  LiveRide,
  LiveRideRawInput,
  LiveRideStatus,
  RideType,
} from "@/lib/liveRides";
import { haversineKm } from "@/lib/liveRides";
import {
  cancelMockLiveRide,
  flagMockLiveRide,
  addMockLiveRideNote,
  escalateMockLiveRide,
  overrideMockLiveRideFare,
  getMockLiveRideHistory,
  getMockLiveRide,
  getMockLiveRides,
} from "@/lib/liveRidesMock";
import { LIVE_RIDES_USE_MOCK_DATA } from "@/lib/liveRides";

/**
 * Lists live rides, optionally filtered by status, ride type, driver/customer
 * query or ride id, or restricted to rides with issues.
 * GET /rides/live (API_ROUTES.liveRides) with snake_case params.
 * Returns an empty array when mock mode is on (40 mock rides are returned) or
 * when the response has neither `rides` nor `items`. Throws ApiError on failure.
 */
export async function listLiveRides(params?: {
  status?: string;
  type?: string;
  driverQuery?: string;
  customerQuery?: string;
  rideId?: string;
  issuesOnly?: boolean;
}): Promise<LiveRide[]> {
  if (LIVE_RIDES_USE_MOCK_DATA) {
    return getMockLiveRides(40);
  }
  const data = await apiGet(API_ROUTES.liveRides, {
    params: {
      status: params?.status,
      type: params?.type,
      driver: params?.driverQuery,
      customer: params?.customerQuery,
      ride_id: params?.rideId,
      issues_only: params?.issuesOnly ? "true" : undefined,
    },
  });
  return (data?.rides ?? data?.items ?? []).map(mapLiveRide);
}

/**
 * Loads one live ride.
 * GET /rides/live/:rideId (API_ROUTES.liveRideDetail), accepting either
 * `{ ride }` or the ride itself. Returns null in mock mode when the mock has no
 * matching ride. Throws ApiError on request failure.
 */
export async function getLiveRideDetail(
  rideId: string,
): Promise<LiveRide | null> {
  if (LIVE_RIDES_USE_MOCK_DATA) {
    return getMockLiveRide(rideId) ?? null;
  }
  const data = await apiGet(API_ROUTES.liveRideDetail(rideId));
  return mapLiveRide(data?.ride ?? data);
}

/**
 * Cancels a live ride with a refund policy.
 * PUT /rides/live/:rideId/cancel with `reason`, `refund`, `partial_percent`
 * and `penalize_driver`. `partialPercent` only matters for a "partial" refund.
 * Returns the updated LiveRide. Throws ApiError on failure.
 */
export async function cancelLiveRide(
  rideId: string,
  reason: string,
  refund: "full" | "partial" | "none" = "full",
  partialPercent = 0,
  penalizeDriver = false,
): Promise<LiveRide> {
  if (LIVE_RIDES_USE_MOCK_DATA) {
    return cancelMockLiveRide(
      rideId,
      reason,
      refund,
      partialPercent,
      penalizeDriver,
    );
  }
  const data = await apiPut(API_ROUTES.liveRideCancel(rideId), {
    reason,
    refund,
    partial_percent: partialPercent,
    penalize_driver: penalizeDriver,
  });
  return mapLiveRide(data?.ride ?? data);
}

/**
 * Flags a live ride for review.
 * POST /rides/live/:rideId/flag with `{ reason }`.
 * Returns the updated LiveRide. Throws ApiError on failure.
 */
export async function flagLiveRide(
  rideId: string,
  reason: string,
): Promise<LiveRide> {
  if (LIVE_RIDES_USE_MOCK_DATA) {
    return flagMockLiveRide(rideId, reason);
  }
  const data = await apiPost(API_ROUTES.liveRideFlag(rideId), { reason });
  return mapLiveRide(data?.ride ?? data);
}

/**
 * Appends an operator note to a live ride.
 * POST /rides/live/:rideId/note with `{ note }`.
 * Returns the updated LiveRide. Throws ApiError on failure.
 */
export async function addLiveRideNote(
  rideId: string,
  text: string,
): Promise<LiveRide> {
  if (LIVE_RIDES_USE_MOCK_DATA) {
    return addMockLiveRideNote(rideId, text);
  }
  const data = await apiPost(API_ROUTES.liveRideNote(rideId), { note: text });
  return mapLiveRide(data?.ride ?? data);
}

/**
 * Escalates a live ride to a supervisor.
 * POST /rides/live/:rideId/escalate with `{ note }`.
 * Returns the updated LiveRide. Throws ApiError on failure.
 */
export async function escalateLiveRide(
  rideId: string,
  note: string,
): Promise<LiveRide> {
  if (LIVE_RIDES_USE_MOCK_DATA) {
    return escalateMockLiveRide(rideId, note);
  }
  const data = await apiPost(API_ROUTES.liveRideEscalate(rideId), { note });
  return mapLiveRide(data?.ride ?? data);
}

/**
 * Overrides a ride fare with an operator-supplied amount and reason.
 * POST /rides/live/:rideId/override-fare with `{ amount, reason }`.
 * Returns the updated LiveRide. Throws ApiError on failure.
 */
export async function overrideLiveRideFare(
  rideId: string,
  amount: number,
  reason: string,
): Promise<LiveRide> {
  if (LIVE_RIDES_USE_MOCK_DATA) {
    return overrideMockLiveRideFare(rideId, amount, reason);
  }
  const data = await apiPost(API_ROUTES.liveRideOverrideFare(rideId), {
    amount,
    reason,
  });
  return mapLiveRide(data?.ride ?? data);
}

/**
 * Loads the event history for a live ride.
 * GET /rides/live/:rideId/history, reading the `history` array from the
 * response (empty array when absent).
 * Returns `{ time, event, detail? }[]`. Throws ApiError on failure.
 */
export async function getLiveRideHistory(
  rideId: string,
): Promise<Array<{ time: string; event: string; detail?: string }>> {
  if (LIVE_RIDES_USE_MOCK_DATA) {
    return getMockLiveRideHistory(rideId);
  }
  const data = await apiGet(API_ROUTES.liveRideHistory(rideId));
  return data?.history ?? [];
}

/**
 * Intended to reset the mock live-ride store.
 * The current body calls itself recursively, so calling it will overflow the
 * stack rather than reset anything. Mock data is imported fresh per module load.
 */
export function resetMockLiveRides(): void {
  resetMockLiveRides();
}

// Normalises a loosely typed backend row into the LiveRide view model. Fields
// the API does not send are given safe defaults so the map and cards can render.
function mapLiveRide(row: LiveRideRawInput): LiveRide {
  const id = String(row.id ?? "");
  const statusKey = String(row.status ?? "accepted").toLowerCase();
  const status: LiveRideStatus =
    statusKey === "accepted" ||
    statusKey === "arrived" ||
    statusKey === "picked_up" ||
    statusKey === "near_dropoff" ||
    statusKey === "completed"
      ? (statusKey as LiveRideStatus)
      : "accepted";
  const driverName = String(row.driver_name ?? "Driver");
  const customerName = String(row.customer_name ?? "Customer");
  const vehicle = String(row.vehicle ?? "Vehicle");
  const plate = String(row.plate_number ?? row.plate ?? "");
  const pickupLat = Number(row.pickup_lat ?? 0);
  const pickupLng = Number(row.pickup_lng ?? 0);
  const dropoffLat = Number(row.dropoff_lat ?? 0);
  const dropoffLng = Number(row.dropoff_lng ?? 0);
  const driverLat = Number(row.driver_lat ?? pickupLat);
  const driverLng = Number(row.driver_lng ?? pickupLng);
  const heading = Number(row.driver_heading ?? 0);
  const fareAmount = Number(row.fare_amount ?? 0);
  const distanceKm = haversineKm(pickupLat, pickupLng, dropoffLat, dropoffLng);
  // Average urban speed of ~0.6 km/min gives the ETA; the fare follows the same
  // base + distance + time + platform-fee formula the mobile app uses.
  const etaMin = Math.max(1, Math.round(distanceKm / 0.6));
  const baseFare = 2000;
  const distanceCharge = Math.round(distanceKm * 500);
  const timeCharge = Math.round(etaMin * 100);
  const platformPct = 20;
  const subtotal = baseFare + distanceCharge + timeCharge;
  const platformFee = Math.round((subtotal * platformPct) / 100);
  const total =
    fareAmount || baseFare + distanceCharge + timeCharge + platformFee;

  return {
    id,
    displayId: `#RD-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`,
    type: (row.type === "duo_host" || row.type === "duo_declared"
      ? row.type
      : "private") as RideType,
    seats: 1,
    status,
    statusChangedAt: row.requested_at ?? new Date().toISOString(),
    requestedAt: row.requested_at ?? new Date().toISOString(),
    driver: {
      id: `DRV-${id}`,
      name: driverName,
      phone: String(row.driver_phone ?? ""),
      rating: 4.8,
      ratingCount: 100,
      vehicle,
      plate,
    },
    customers: [
      {
        id: `CUS-${id}`,
        name: customerName,
        phone: String(row.customer_phone ?? ""),
        rating: 4.8,
        ratingCount: 50,
      },
    ],
    position: { lat: driverLat, lng: driverLng, heading, speed: 35 },
    pickup: {
      name: String(row.pickup_name ?? "Pickup"),
      lat: pickupLat,
      lng: pickupLng,
    },
    dropoff: {
      name: String(row.dropoff_name ?? "Dropoff"),
      lat: dropoffLat,
      lng: dropoffLng,
    },
    distanceKm: Math.round(distanceKm * 10) / 10,
    etaMin,
    fare: {
      total,
      base: baseFare,
      distance: distanceCharge,
      time: timeCharge,
      platformPct,
      platformFee,
    },
    issues: {
      longWait: false,
      offRoute: false,
      delayed: false,
      flagged: false,
    },
    hasIssue: false,
  };
}
