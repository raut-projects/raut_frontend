import {
  API_ROUTES,
  OTP_DEFAULT_TTL_SECONDS,
  OTP_VERIFY_FIELD,
} from '../lib/config.js'
import { ApiError, envelopeData, envelopeMessage, request } from './http.js'
import { clearSession, getAccessToken, getSessionSnapshot, saveSession } from './tokenStore.js'

export const normalizePhone = (value) => String(value ?? '').replace(/[\s()\-.]/g, '')

export const isValidPhone = (value) => {
  const phone = normalizePhone(value)
  return /^\+?\d{9,15}$/.test(phone)
}

const formatRole = (role) => {
  if (!role) return 'Admin'
  return String(role)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

const buildInitials = (name) => {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) return 'AD'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

const toSession = (user, phone) => {
  const name = user?.full_name ?? user?.fullName ?? user?.name ?? user?.email ?? 'Admin'
  const role = user?.role ?? 'user'

  return {
    id: user?.id ?? null,
    name,
    phone: user?.phone ?? phone,
    role,
    roleLabel: formatRole(role),
    initials: buildInitials(name),
    signedInAt: new Date().toISOString(),
  }
}

export async function requestOtp(phone) {
  const payload = await request(API_ROUTES.otpSend, {
    method: 'POST',
    body: { phone: normalizePhone(phone) },
    auth: false,
  })

  return {
    phone: payload?.phone ?? normalizePhone(phone),
    expiresInSeconds: payload?.expires_in_seconds ?? OTP_DEFAULT_TTL_SECONDS,
    message: envelopeMessage(payload) || 'We sent a verification code to your phone.',
  }
}

export async function verifyOtp({ phone, code }) {
  const payload = await request(API_ROUTES.otpVerify, {
    method: 'POST',
    body: {
      phone: normalizePhone(phone),
      [OTP_VERIFY_FIELD]: String(code ?? '').trim(),
    },
    auth: false,
  })

  const data = envelopeData(payload) ?? {}
  const accessToken = data.access_token ?? data.accessToken ?? data.token

  if (!accessToken) {
    throw new ApiError('The server did not return a session. Please try again.', 500, payload)
  }

  const session = toSession(data.user, normalizePhone(phone))

  saveSession({
    session,
    accessToken,
    refreshToken: data.refresh_token ?? data.refreshToken ?? null,
    expiresIn: data.expires_in ?? data.expiresIn ?? null,
  })

  return session
}

export function getSession() {
  return getSessionSnapshot()
}

export function signOut() {
  clearSession()
}

export function getToken() {
  return getAccessToken()
}
