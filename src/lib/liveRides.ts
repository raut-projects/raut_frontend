export type LiveRideStatus =
  | "accepted"
  | "arrived"
  | "picked_up"
  | "near_dropoff"
  | "completed";
export type RideType = "private" | "duo_host" | "duo_declared";
export type LiveRideViewMode = "map" | "list" | "both";

export interface LiveRideDriver {
  id: string;
  name: string;
  phone: string;
  rating: number;
  ratingCount: number;
  vehicle: string;
  plate: string;
}

export interface LiveRideCustomer {
  id: string;
  name: string;
  phone: string;
  rating: number;
  ratingCount: number;
}

export interface LiveRidePosition {
  lat: number;
  lng: number;
  heading: number;
  speed: number;
}

export interface LiveRideWaypoint {
  name: string;
  lat: number;
  lng: number;
}

export interface LiveRideFare {
  total: number;
  base: number;
  distance: number;
  time: number;
  platformPct: number;
  platformFee: number;
}

export interface LiveRideIssues {
  longWait: boolean;
  offRoute: boolean;
  delayed: boolean;
  flagged: boolean;
}

export interface LiveRideNote {
  id: string;
  text: string;
  createdAt: string;
}

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

export const LIVE_RIDE_STATUS_LABELS: Record<LiveRideStatus, string> = {
  accepted: "Accepted",
  arrived: "Arrived",
  picked_up: "Picked Up",
  near_dropoff: "Near Dropoff",
  completed: "Completed",
};

export const LIVE_RIDE_TYPE_LABELS: Record<RideType, string> = {
  private: "Private",
  duo_host: "DUO (Host)",
  duo_declared: "DUO (Declared)",
};

export const LIVE_RIDE_FILTER_STATUSES: LiveRideStatus[] = [
  "accepted",
  "arrived",
  "picked_up",
  "near_dropoff",
];

export const STATUS_ORDER: LiveRideStatus[] = [
  "accepted",
  "arrived",
  "picked_up",
  "near_dropoff",
  "completed",
];

export const LIVE_RIDE_FILTER_TYPES: RideType[] = [
  "private",
  "duo_host",
  "duo_declared",
];

export const DEFAULT_RIDE_COLORS = {
  driver: "#2563eb",
  pickup: "#16a34a",
  dropoff: "#dc2626",
};

export const LIVE_RIDES_DAR_ES_SALAAM_CENTER = { lat: -6.7924, lng: 39.2083 };
export const LIVE_RIDES_DAR_BOUNDS = {
  north: -6.74,
  south: -6.92,
  east: 39.36,
  west: 39.1,
};

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

export function stableHash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function deterministicChoice<T>(value: string, items: T[]): T {
  return items[stableHash(value) % items.length];
}

export function deterministicNumber(
  value: string,
  min: number,
  max: number,
): number {
  return min + (stableHash(value) % (max - min + 1));
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return phone;
  const tail = digits.slice(-4);
  return `+255 XXX XXX ${tail}`;
}

export function formatMoneyTZS(value: number): string {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: "TZS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(value)));
}

export function formatEta(minutes: number): string {
  if (minutes <= 0) return "Arriving";
  return `${Math.round(minutes)} min`;
}

export function formatAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const seconds = Math.max(0, Math.floor(ms / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} h ago`;
}

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

export const LIVE_RIDES_USE_MOCK_DATA =
  process.env.NEXT_PUBLIC_USE_MOCK_LIVE_RIDES !== "false";
