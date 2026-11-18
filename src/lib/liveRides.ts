// Live rides domain model and geo/formatting helpers. Defines the ride shapes
// used by the live map and list, status/type labels, Dar es Salaam map bounds
// and deterministic helpers that keep seeded mock data stable across renders.

/** Lifecycle status of an active ride ("completed" is terminal). */
export type LiveRideStatus =
  | "accepted"
  | "arrived"
  | "picked_up"
  | "near_dropoff"
  | "completed";
/** Ride product type, including the two DUO roles. */
export type RideType = "private" | "duo_host" | "duo_declared";
/** How the live rides screen presents rides. */
export type LiveRideViewMode = "map" | "list" | "both";

/** Driver summary attached to a live ride. */
export interface LiveRideDriver {
  id: string;
  name: string;
  phone: string;
  rating: number;
  ratingCount: number;
  vehicle: string;
  plate: string;
}

/** Customer summary attached to a live ride. */
export interface LiveRideCustomer {
  id: string;
  name: string;
  phone: string;
  rating: number;
  ratingCount: number;
}

/** Driver position. `heading` is in degrees. */
export interface LiveRidePosition {
  lat: number;
  lng: number;
  heading: number;
  speed: number;
}

/** A named pickup or dropoff point. */
export interface LiveRideWaypoint {
  name: string;
  lat: number;
  lng: number;
}

/** Fare breakdown in TZS. `platformPct` is the platform fee percentage. */
export interface LiveRideFare {
  total: number;
  base: number;
  distance: number;
  time: number;
  platformPct: number;
  platformFee: number;
}

/** Issue flags detected for a ride. */
export interface LiveRideIssues {
  longWait: boolean;
  offRoute: boolean;
  delayed: boolean;
  flagged: boolean;
}

/** A free-text operational note on a ride. */
export interface LiveRideNote {
  id: string;
  text: string;
  createdAt: string;
}

/** A ride as consumed by the live rides UI. Timestamps are ISO strings. */
export interface LiveRide {
  id: string;
  displayId: string;
  type: RideType;
  seats: number;
  status: LiveRideStatus;
  statusChangedAt: string;
  requestedAt: string;
  driver: LiveRideDriver;
  customers: LiveRideCustomer[];
  position: LiveRidePosition;
  pickup: LiveRideWaypoint;
  dropoff: LiveRideWaypoint;
  distanceKm: number;
  etaMin: number;
  fare: LiveRideFare;
  issues: LiveRideIssues;
  hasIssue: boolean;
  removedAt?: string;
}

/** Loosely-typed ride shape as returned by the API, before normalization. */
export interface LiveRideRawInput {
  id: string;
  status: string;
  type?: string;
  driver_name?: string | null;
  driver_phone?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  pickup_name?: string | null;
  dropoff_name?: string | null;
  pickup_lat?: number | null;
  pickup_lng?: number | null;
  dropoff_lat?: number | null;
  dropoff_lng?: number | null;
  driver_lat?: number | null;
  driver_lng?: number | null;
  driver_heading?: number | null;
  fare_amount?: number | null;
  requested_at?: string | null;
  vehicle?: string | null;
  plate_number?: string | null;
  plate?: string | null;
}

/** Status to display label lookup. */
export const LIVE_RIDE_STATUS_LABELS: Record<LiveRideStatus, string> = {
  accepted: "Accepted",
  arrived: "Arrived",
  picked_up: "Picked Up",
  near_dropoff: "Near Dropoff",
  completed: "Completed",
};

/** Ride type to display label lookup. */
export const LIVE_RIDE_TYPE_LABELS: Record<RideType, string> = {
  private: "Private",
  duo_host: "DUO (Host)",
  duo_declared: "DUO (Declared)",
};

/** Active statuses offered as list filters (excludes completed). */
export const LIVE_RIDE_FILTER_STATUSES: LiveRideStatus[] = [
  "accepted",
  "arrived",
  "picked_up",
  "near_dropoff",
];

/** Canonical status progression, used for ordering and progress calculation. */
export const STATUS_ORDER: LiveRideStatus[] = [
  "accepted",
  "arrived",
  "picked_up",
  "near_dropoff",
  "completed",
];

/** All ride types offered as filters. */
export const LIVE_RIDE_FILTER_TYPES: RideType[] = [
  "private",
  "duo_host",
  "duo_declared",
];

/** Marker colours for driver, pickup and dropoff. */
export const DEFAULT_RIDE_COLORS = {
  driver: "#2563eb",
  pickup: "#16a34a",
  dropoff: "#dc2626",
};

/** Default map centre (Dar es Salaam). */
export const LIVE_RIDES_DAR_ES_SALAAM_CENTER = { lat: -6.7924, lng: 39.2083 };
/** Map bounds restricting the live map to Dar es Salaam. */
export const LIVE_RIDES_DAR_BOUNDS = {
  north: -6.74,
  south: -6.92,
  east: 39.36,
  west: 39.1,
};

/** Sample Dar es Salaam locations used to seed mock rides. */
export const LIVE_RIDE_LOCATIONS: Array<{
  name: string;
  lat: number;
  lng: number;
}> = [
  { name: "Mwenge", lat: -6.7844, lng: 39.2476 },
  { name: "Posta", lat: -6.8222, lng: 39.2838 },
  { name: "Mikocheni", lat: -6.7744, lng: 39.2579 },
  { name: "Masaki", lat: -6.7821, lng: 39.2832 },
  { name: "Kariakoo", lat: -6.8279, lng: 39.2805 },
  { name: "Ubungo", lat: -6.79, lng: 39.211 },
  { name: "Mbezi", lat: -6.7255, lng: 39.1805 },
  { name: "Kinondoni", lat: -6.7867, lng: 39.2622 },
  { name: "Msasani", lat: -6.7618, lng: 39.296 },
  { name: "Airport", lat: -6.8787, lng: 39.2026 },
];

/** Deterministic 32-bit hash of a string, used to seed mock data. */
export function stableHash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Picks an item from `items` deterministically based on `value`. */
export function deterministicChoice<T>(value: string, items: T[]): T {
  return items[stableHash(value) % items.length];
}

/** Returns a deterministic integer in [min, max] derived from `value`. */
export function deterministicNumber(
  value: string,
  min: number,
  max: number,
): number {
  return min + (stableHash(value) % (max - min + 1));
}

/** Masks a phone number, keeping only the last 4 digits visible. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return phone;
  const tail = digits.slice(-4);
  return `+255 XXX XXX ${tail}`;
}

/** Formats an amount as TZS currency (no decimals). */
export function formatMoneyTZS(value: number): string {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: "TZS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(value)));
}

/** Formats an ETA in minutes; "Arriving" when 0 or less. */
export function formatEta(minutes: number): string {
  if (minutes <= 0) return "Arriving";
  return `${Math.round(minutes)} min`;
}

/** Formats an ISO timestamp as a relative "X ago" string. */
export function formatAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const seconds = Math.max(0, Math.floor(ms / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} h ago`;
}

/** Great-circle distance in km between two lat/lng points. */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Initial bearing in degrees from point 1 to point 2. */
export function bearingDegrees(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Linearly interpolates a position toward a waypoint; heading is recomputed. */
export function interpolatePosition(
  from: LiveRidePosition,
  to: LiveRideWaypoint,
  fraction: number,
): LiveRidePosition {
  return {
    lat: from.lat + (to.lat - from.lat) * fraction,
    lng: from.lng + (to.lng - from.lng) * fraction,
    heading: bearingDegrees(from.lat, from.lng, to.lat, to.lng),
    speed: from.speed,
  };
}

export function isFullControlRole(role: string | null): boolean {
  if (!role) return false;
  const normalized = role.trim().toLowerCase();
  return ["super_admin", "platform_manager", "admin", "owner"].includes(
    normalized,
  );
}

export function canEscalateOrNote(role: string | null): boolean {
  if (!role) return false;
  const normalized = role.trim().toLowerCase();
  return [
    "operations_agent",
    "operator",
    "support_agent",
    "support",
    "analyst",
    "super_admin",
    "platform_manager",
    "admin",
    "owner",
  ].includes(normalized);
}

/** Whether mock data is used for live rides (disabled only when env is "false"). */
export const LIVE_RIDES_USE_MOCK_DATA =
  process.env.NEXT_PUBLIC_USE_MOCK_LIVE_RIDES !== "false";
