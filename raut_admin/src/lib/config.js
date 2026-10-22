const rawBaseUrl = import.meta.env?.VITE_API_BASE_URL ?? ''

export const API_BASE_URL = rawBaseUrl.trim().replace(/\/+$/, '')

export const isApiConfigured = Boolean(API_BASE_URL)

export const API_ROUTES = {
  otpSend: '/auth/otp/send',
  otpVerify: '/auth/otp/verify',
  refresh: '/auth/refresh',
  me: '/auth/me',
  promote: '/admin/promote',
  users: '/admin/users',
  riders: '/admin/drivers',
  verifyDrivers: '/admin/drivers/{driver_id}/verify',
  rejectDrivers: '/admin/drivers/{driver_id}/reject',
  rides: '/admin/rides',
  activeRides: '/admin/rides/active',
    
}

export const OTP_CODE_LENGTH = 6
export const OTP_DEFAULT_TTL_SECONDS = 300

export const OTP_VERIFY_FIELD = 'otp_code'
export const REFRESH_TOKEN_FIELD = 'refresh_token'

export const REQUEST_TIMEOUT_MS = 15000

// How long a role confirmed by the server stays trusted before the admin gate
// asks the backend again (GET /auth/me).
export const ROLE_REVALIDATE_MS = 5 * 60 * 1000
