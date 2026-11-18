// Raw environment access. Reads the NEXT_PUBLIC_* variables once at module load
// and exposes them unprocessed; src/lib/config.ts trims, defaults and derives
// the usable values from these strings.

/** Base URL for the backend API (NEXT_PUBLIC_API_BASE_URL); empty when unset. */
export const API_BASE_URL_RAW = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/** Comma-separated admin role keys (NEXT_PUBLIC_ADMIN_ROLES); empty when unset. */
export const ADMIN_ROLES_RAW = process.env.NEXT_PUBLIC_ADMIN_ROLES ?? "";

/** Base URL used for referral sign-up links (NEXT_PUBLIC_REFERRAL_BASE_URL). */
export const REFERRAL_BASE_URL_RAW =
  process.env.NEXT_PUBLIC_REFERRAL_BASE_URL ?? "";

/** Google Maps JavaScript API key (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY). */
export const GOOGLE_MAPS_API_KEY_RAW =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

/** Explicit live-rides WebSocket URL (NEXT_PUBLIC_LIVE_RIDES_WS_URL). */
export const LIVE_RIDES_WS_URL_RAW =
  process.env.NEXT_PUBLIC_LIVE_RIDES_WS_URL ?? "";
