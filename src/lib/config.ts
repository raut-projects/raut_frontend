// Runtime configuration derived from environment variables. Normalizes the raw
// NEXT_PUBLIC_* values from ./env into the base URL, WebSocket URL, referral
// link, Maps key and shared API route table, and defines the analytics windows,
// request timeout and role-revalidation constants used across the app.

import {
  API_BASE_URL_RAW,
  REFERRAL_BASE_URL_RAW,
  GOOGLE_MAPS_API_KEY_RAW,
  LIVE_RIDES_WS_URL_RAW,
} from "./env";

// Normalized once so every consumer sees the same trimmed, trailing-slash-free
// base URL.
const rawBaseUrl = API_BASE_URL_RAW;

/**
 * Backend API base URL: the env value trimmed of surrounding whitespace and
 * trailing slashes. Empty string when the variable is unset.
 */
export const API_BASE_URL = rawBaseUrl.trim().replace(/\/+$/, "");

/** True when {@link API_BASE_URL} is set, i.e. the app can reach the backend. */
export const isApiConfigured = Boolean(API_BASE_URL);

/** Trimmed Google Maps JavaScript API key (empty when unset). */
export const GOOGLE_MAPS_API_KEY = GOOGLE_MAPS_API_KEY_RAW.trim();
/** True when a Google Maps API key is configured. */
export const hasGoogleMapsKey = Boolean(GOOGLE_MAPS_API_KEY);

/**
 * WebSocket URL for live rides.
 *
 * Uses NEXT_PUBLIC_LIVE_RIDES_WS_URL when set; otherwise derives it from
 * {@link API_BASE_URL} by swapping the leading `http` for `ws`. Empty when
 * neither is available.
 */
export const LIVE_RIDES_WS_URL = (() => {
  if (LIVE_RIDES_WS_URL_RAW.trim()) return LIVE_RIDES_WS_URL_RAW.trim();
  if (!API_BASE_URL) return "";
  return API_BASE_URL.replace(/^http/, "ws");
})();

/**
 * Base URL for referral sign-up links, defaulting to https://raut.app/signup
 * when unset. Trailing slashes are stripped.
 */
export const REFERRAL_BASE_URL = (
  REFERRAL_BASE_URL_RAW.trim() || "https://raut.app/signup"
).replace(/\/+$/, "");

/**
 * Central API route table, grouped by feature area. Static paths are strings;
 * parameterized paths are functions whose arguments are URL-encoded.
 */
export const API_ROUTES = {
  login: "/auth/login",
  refresh: "/auth/refresh",
  me: "/auth/me",
  resetPassword: "/auth/password/reset",
  passwordUpdate: "/auth/password/update",
  notifications: "/notifications/",
  promote: "/admin/promote",
  users: "/admin/users",
  adminUserInvite: "/admin/users/invite",
  adminUser: (userId: string) => `/admin/users/${encodeURIComponent(userId)}`,
  drivers: "/admin/drivers",
  rides: "/admin/rides",

  // live ride APIs
  liveRides: "/admin/rides/live",
  liveRideDetail: (rideId: string) =>
    `/admin/rides/${encodeURIComponent(rideId)}/detail`,
  liveRideCancel: (rideId: string) =>
    `/admin/rides/${encodeURIComponent(rideId)}/cancel`,
  liveRideFlag: (rideId: string) =>
    `/admin/rides/${encodeURIComponent(rideId)}/flag`,
  liveRideNote: (rideId: string) =>
    `/admin/rides/${encodeURIComponent(rideId)}/note`,
  liveRideContact: (rideId: string) =>
    `/admin/rides/${encodeURIComponent(rideId)}/contact`,
  liveRideHistory: (rideId: string) =>
    `/admin/rides/${encodeURIComponent(rideId)}/history`,
  liveRideOverrideFare: (rideId: string) =>
    `/admin/rides/${encodeURIComponent(rideId)}/override-fare`,
  liveRideEscalate: (rideId: string) =>
    `/admin/rides/${encodeURIComponent(rideId)}/escalate`,

  // ride API endpoints
  rideDispute: (rideId: string) =>
    `/admin/rides/${encodeURIComponent(rideId)}/dispute`,
  rideResolveDispute: (rideId: string) =>
    `/admin/rides/${encodeURIComponent(rideId)}/resolve-dispute`,
  rideRefund: (rideId: string) =>
    `/admin/rides/${encodeURIComponent(rideId)}/refund`,
  routes: "/admin/routes",
  documents: "/admin/documents",
  transactions: "/admin/transactions",
  payouts: "/admin/payouts",
  analyticsOverview: "/admin/analytics/overview",
  analyticsRevenue: "/admin/analytics/revenue",
  analyticsDrivers: "/admin/analytics/drivers",
  analyticsRides: "/admin/analytics/rides",
  analyticsPeakHours: "/admin/analytics/peak-hours",

  // System configuration endpoints (flat config registry).
  configs: "/admin/configs",
  config: (configKey: string) =>
    `/admin/configs/${encodeURIComponent(configKey)}`,
  configHistory: (configKey: string) =>
    `/admin/configs/${encodeURIComponent(configKey)}/history`,

  // Support Tickets Endpoints
  supportTickets: "/support/tickets",
  supportAgents: "/support/agents",
  supportTicket: (ticketId: string) =>
    `/support/tickets/${encodeURIComponent(ticketId)}`,
  supportTicketMessages: (ticketId: string) =>
    `/support/tickets/${encodeURIComponent(ticketId)}/messages`,
  supportTicketAssignment: (ticketId: string) =>
    `/support/tickets/${encodeURIComponent(ticketId)}/assignment`,
  supportTicketAssignToMe: (ticketId: string) =>
    `/support/tickets/${encodeURIComponent(ticketId)}/assign-to-me`,
  supportTicketStatus: (ticketId: string) =>
    `/support/tickets/${encodeURIComponent(ticketId)}/status`,
  supportTicketPriority: (ticketId: string) =>
    `/support/tickets/${encodeURIComponent(ticketId)}/priority`,
  supportTicketEscalate: (ticketId: string) =>
    `/support/tickets/${encodeURIComponent(ticketId)}/escalate`,

  // Marketing and Referral Endpoints
  marketingPromotions: "/promotions/",
  marketingPromotion: (promotionId: string) =>
    `/promotions/${encodeURIComponent(promotionId)}`,
  marketingPromotionActivate: (promotionId: string) =>
    `/promotions/${encodeURIComponent(promotionId)}/activate`,
  marketingPromotionDeactivate: (promotionId: string) =>
    `/promotions/${encodeURIComponent(promotionId)}/deactivate`,
  referralPrograms: "/referrals/programs",
  referralProgram: (programId: string) =>
    `/referrals/programs/${encodeURIComponent(programId)}`,
  referralProgramEnroll: (programId: string) =>
    `/referrals/programs/${encodeURIComponent(programId)}/enroll`,
  referralProgramBulkEnroll: (programId: string) =>
    `/referrals/programs/${encodeURIComponent(programId)}/enroll/bulk`,
  referralProgramUserEnrollment: (programId: string, userId: string) =>
    `/referrals/programs/${encodeURIComponent(programId)}/enroll/${encodeURIComponent(userId)}`,
  referralUsers: "/referrals/users",
  referralUser: (userId: string) =>
    `/referrals/users/${encodeURIComponent(userId)}`,
  referralRelationships: "/referrals/relationships",
  referralStats: "/referrals/stats",
  referralTopReferrers: "/referrals/top-referrers",
  referralPendingPayments: "/referrals/payments/pending",
  referralPaymentPay: (paymentId: string) =>
    `/referrals/payments/${encodeURIComponent(paymentId)}/pay`,
  myReferralCode: "/referrals/my-code",
  processReferral: "/referrals/process",
};

/**
 * Number of days covered by each analytics window. `day|week|month` is sent as
 * the `period` parameter; the peak-hours endpoint uses the day count as
 * `days_back`.
 */
// Analytics windows. `day|week|month` is sent as `period` to the analytics
// endpoints, while peak hours uses the number of days as `days_back`.
export const PERIOD_DAYS: Record<"day" | "week" | "month", number> = {
  day: 1,
  week: 7,
  month: 30,
};

/** Field name carrying the refresh token in auth request and response bodies. */
export const REFRESH_TOKEN_FIELD = "refresh_token";

/** Default API request timeout in milliseconds (15 seconds). */
export const REQUEST_TIMEOUT_MS = 15000;

/**
 * How long a role confirmed by the server stays trusted before the admin gate
 * asks the backend again (GET /auth/me). Five minutes.
 */
// How long a role confirmed by the server stays trusted before the admin gate
// asks the backend again (GET /auth/me).
export const ROLE_REVALIDATE_MS = 5 * 60 * 1000;
