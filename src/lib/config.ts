import { API_BASE_URL_RAW, REFERRAL_BASE_URL_RAW } from "./env";

const rawBaseUrl = API_BASE_URL_RAW;

export const API_BASE_URL = rawBaseUrl.trim().replace(/\/+$/, "");

export const isApiConfigured = Boolean(API_BASE_URL);

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
  adminUser: (userId: string) =>
    `/admin/users/${encodeURIComponent(userId)}`,
  drivers: "/admin/drivers",
  rides: "/admin/rides",
  routes: "/admin/routes",
  documents: "/admin/documents",
  transactions: "/admin/transactions",
  payouts: "/admin/payouts",
  analyticsOverview: "/admin/analytics/overview",
  analyticsRevenue: "/admin/analytics/revenue",
  analyticsDrivers: "/admin/analytics/drivers",
  analyticsRides: "/admin/analytics/rides",
  analyticsPeakHours: "/admin/analytics/peak-hours",
  configPricing: "/admin/config/pricing",
  configFeatures: "/admin/config/features",
  configOperations: "/admin/config/operations",
  configIntegrations: "/admin/config/integrations",
  configIntegrationTest: (service: string) =>
    `/admin/config/integrations/${service}/test`,
  configHistory: "/admin/config/history",
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
  marketingPromotions: "/admin/marketing/promotions",
  marketingPromotion: (promotionId: string) =>
    `/admin/marketing/promotions/${encodeURIComponent(promotionId)}`,
  marketingReferralCodes: "/admin/marketing/referrals/codes",
  marketingReferralCodeStats: "/admin/marketing/referrals/codes/stats",
  marketingReferralCode: (codeId: string) =>
    `/admin/marketing/referrals/codes/${encodeURIComponent(codeId)}`,
  marketingReferralCodeSend: (codeId: string) =>
    `/admin/marketing/referrals/codes/${encodeURIComponent(codeId)}/send`,
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
