import {
  API_BASE_URL_RAW,
  REFERRAL_BASE_URL_RAW,
  GOOGLE_MAPS_API_KEY_RAW,
  LIVE_RIDES_WS_URL_RAW,
} from "./env";

const rawBaseUrl = API_BASE_URL_RAW;

export const API_BASE_URL = rawBaseUrl.trim().replace(/\/+$/, "");

export const isApiConfigured = Boolean(API_BASE_URL);

export const GOOGLE_MAPS_API_KEY = GOOGLE_MAPS_API_KEY_RAW.trim();
export const hasGoogleMapsKey = Boolean(GOOGLE_MAPS_API_KEY);

export const LIVE_RIDES_WS_URL = (() => {
  if (LIVE_RIDES_WS_URL_RAW.trim()) return LIVE_RIDES_WS_URL_RAW.trim();
  if (!API_BASE_URL) return "";
  return API_BASE_URL.replace(/^http/, "ws");
})();

export const REFERRAL_BASE_URL = (
  REFERRAL_BASE_URL_RAW.trim() || "https://raut.app/signup"
).replace(/\/+$/, "");

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

  // Platform Configurations Endpoints
  configPricing: "/admin/config/pricing",
  configFeatures: "/admin/config/features",
  configOperations: "/admin/config/operations",
  configIntegrations: "/admin/config/integrations",
  configIntegrationTest: (service: string) =>
    `/admin/config/integrations/${service}/test`,
  configHistory: "/admin/config/history",

  // Support Tickets Endpoints
  supportTickets: "/admin/support/tickets",
  supportAgents: "/admin/support/agents",
  supportTicket: (ticketId: string) =>
    `/admin/support/tickets/${encodeURIComponent(ticketId)}`,
  supportTicketMessages: (ticketId: string) =>
    `/admin/support/tickets/${encodeURIComponent(ticketId)}/messages`,
  supportTicketAssignment: (ticketId: string) =>
    `/admin/support/tickets/${encodeURIComponent(ticketId)}/assignment`,
  supportTicketAssignToMe: (ticketId: string) =>
    `/admin/support/tickets/${encodeURIComponent(ticketId)}/assign-to-me`,
  supportTicketStatus: (ticketId: string) =>
    `/admin/support/tickets/${encodeURIComponent(ticketId)}/status`,
  supportTicketPriority: (ticketId: string) =>
    `/admin/support/tickets/${encodeURIComponent(ticketId)}/priority`,
  supportTicketEscalate: (ticketId: string) =>
    `/admin/support/tickets/${encodeURIComponent(ticketId)}/escalate`,

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

// Analytics windows. `day|week|month` is sent as `period` to the analytics
// endpoints, while peak hours uses the number of days as `days_back`.
export const PERIOD_DAYS: Record<"day" | "week" | "month", number> = {
  day: 1,
  week: 7,
  month: 30,
};

export const REFRESH_TOKEN_FIELD = "refresh_token";

export const REQUEST_TIMEOUT_MS = 15000;

// How long a role confirmed by the server stays trusted before the admin gate
// asks the backend again (GET /auth/me).
export const ROLE_REVALIDATE_MS = 5 * 60 * 1000;
