const rawBaseUrl = import.meta.env?.VITE_API_BASE_URL ?? ''

export const API_BASE_URL = rawBaseUrl.trim().replace(/\/+$/, '')

export const isApiConfigured = Boolean(API_BASE_URL)

export const API_ROUTES = {
  otpSend: '/auth/otp/send',
  otpVerify: '/auth/otp/verify',
  refresh: '/auth/refresh',
  me: '/auth/me',
  notifications: '/notifications/',
  promote: '/admin/promote',
  users: '/admin/users',
  drivers: '/admin/drivers',
  rides: '/admin/rides',
  routes: '/admin/routes',
  documents: '/admin/documents',
  transactions: '/admin/transactions',
  payouts: '/admin/payouts',
  analyticsOverview: '/admin/analytics/overview',
  analyticsRevenue: '/admin/analytics/revenue',
  analyticsDrivers: '/admin/analytics/drivers',
  analyticsRides: '/admin/analytics/rides',
  analyticsPeakHours: '/admin/analytics/peak-hours',
}

// Analytics windows. `day|week|month` is sent as `period` to the analytics
// endpoints, while peak hours uses the number of days as `days_back`.
export const PERIOD_DAYS: Record<'day' | 'week' | 'month', number> = {
  day: 1,
  week: 7,
  month: 30,
}

export const OTP_CODE_LENGTH = 6
export const OTP_DEFAULT_TTL_SECONDS = 300

export const OTP_VERIFY_FIELD = 'otp_code'
export const REFRESH_TOKEN_FIELD = 'refresh_token'

export const REQUEST_TIMEOUT_MS = 15000

// How long a role confirmed by the server stays trusted before the admin gate
// asks the backend again (GET /auth/me).
export const ROLE_REVALIDATE_MS = 5 * 60 * 1000
