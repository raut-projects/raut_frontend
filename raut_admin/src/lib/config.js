const rawBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

export const API_BASE_URL = rawBaseUrl.trim().replace(/\/+$/, '')

export const isApiConfigured = Boolean(API_BASE_URL)

export const API_ROUTES = {
  otpSend: '/auth/otp/send',
  otpVerify: '/auth/otp/verify',
  refresh: '/auth/refresh',
  me: '/auth/me',
  promote: '/admin/promote',
}

export const OTP_CODE_LENGTH = 6
export const OTP_DEFAULT_TTL_SECONDS = 300

export const OTP_VERIFY_FIELD = 'otp_code'
export const REFRESH_TOKEN_FIELD = 'refresh_token'

export const REQUEST_TIMEOUT_MS = 15000
