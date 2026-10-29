import {
  API_ROUTES,
  OTP_DEFAULT_TTL_SECONDS,
  OTP_VERIFY_FIELD,
} from '../lib/config'
import { firstRole, formatRole, isAdminRole, resolveRole } from '../lib/roles'
import { ApiError, envelopeData, envelopeMessage, request, refreshAccessToken } from './http'
import {
  clearSession,
  getAccessToken,
  getSessionSnapshot,
  saveSession,
  updateSession,
  updateTokens,
} from './tokenStore'

export const normalizePhone = (value) => String(value ?? '').replace(/[\s()\-.]/g, '')

export const isValidPhone = (value) => {
  const phone = normalizePhone(value)
  return /^\+?\d{9,15}$/.test(phone)
}

const firstText = (...values) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }

  return null
}

const buildInitials = (name) => {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) return 'U'

  if (parts.length === 1) {
    const only = parts[0]

    if (/^\+?\d+$/.test(only)) {
      return only.replace(/\D/g, '').slice(-2).padStart(2, '0')
    }

    return only.slice(0, 2).toUpperCase()
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

const decodeJwtPayload = (token) => {
  try {
    const [, payload] = String(token ?? '').split('.')
    if (!payload) return null

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')

    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

// The role can arrive on the user object, beside the tokens, as a list, or only
// inside the access token. Any of them is enough, and a missing role means "not
// an admin" rather than "admin".
const roleFromPayload = ({ user, data, accessToken }) =>
  resolveRole(
    user?.role,
    user?.roles,
    data?.role,
    data?.roles,
    decodeJwtPayload(accessToken)?.role,
  )

// Same lookup without the token fallback. The token can still carry the role a
// user had before a promotion, so it must never win over a fresh server answer.
const roleFromResponse = ({ user, data }) =>
  resolveRole(user?.role, user?.roles, data?.role, data?.roles)

const toSession = (user, phone, fallbackRole) => {
  const fallbackPhone = normalizePhone(phone)
  const role = firstRole(user?.role, user?.roles, fallbackRole) ?? 'user'

  const resolvedName =
    firstText(user?.full_name, user?.fullName, user?.name, user?.email) ??
    firstText(user?.phone, fallbackPhone) ??
    'User'

  // Accounts without a name fall back to their phone number, which reads badly
  // in the header and on the dashboard.
  const name = /^\+?\d[\d\s()-]{6,}$/.test(resolvedName)
    ? isAdminRole(role)
      ? 'Admin'
      : 'User'
    : resolvedName

  return {
    id: user?.id ?? null,
    name,
    phone: user?.phone ?? fallbackPhone,
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

  const data = envelopeData(payload) ?? {}

  return {
    phone: data.phone ?? payload?.phone ?? normalizePhone(phone),
    expiresInSeconds:
      data.expires_in_seconds ??
      payload?.expires_in_seconds ??
      OTP_DEFAULT_TTL_SECONDS,
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

  const user = data.user ?? data
  const role = roleFromPayload({ user, data, accessToken })

  const session = toSession(user, normalizePhone(phone), role)

  saveSession({
    session: { ...session, roleVerifiedAt: Date.now() },
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

// Asks the backend who the signed in user actually is. This is the source of
// truth for the role, the local session only caches it.
export async function fetchCurrentUser() {
  const payload = await request(API_ROUTES.me, { auth: true })
  const data = envelopeData(payload) ?? {}
  const user = data.user ?? data

  return {
    user,
    role: roleFromResponse({ user, data }),
  }
}

const signInAgainError = (message) => {
  const error = new ApiError(message, 409, null)
  error.requiresSignIn = true
  return error
}

export async function requestAdminAccess(secret) {
  const payload = await request(API_ROUTES.promote, {
    method: 'POST',
    body: { secret: String(secret ?? '').trim() },
    auth: true,
    form: true,
  })

  const data = envelopeData(payload) ?? {}
  const promotedAccessToken = data.access_token ?? data.accessToken ?? data.token ?? null
  const promotedRefreshToken = data.refresh_token ?? data.refreshToken ?? null
  const promotedExpiresIn = data.expires_in ?? data.expiresIn ?? null

  if (promotedRefreshToken) {
    updateTokens({ refreshToken: promotedRefreshToken })
  }

  if (promotedAccessToken) {
    updateTokens({ accessToken: promotedAccessToken, expiresIn: promotedExpiresIn })
  }

  const promotedUser = data.user ?? data
  let role = roleFromResponse({ user: promotedUser, data })

  if (!role) {
    const current = await fetchCurrentUser()
    role = current.role
  }

  if (!isAdminRole(role)) {
    throw new ApiError(
      'That secret was not accepted. Your access level has not changed.',
      403,
      payload,
    )
  }

  // The access token has to carry the new role, otherwise the backend keeps
  // treating the user as a plain user on every later request.
  let accessToken = promotedAccessToken ?? getAccessToken()

  if (!promotedAccessToken) {
    const refreshed = await refreshAccessToken()
    accessToken = getAccessToken()

    if (!refreshed || !accessToken) {
      throw signInAgainError(
        'Your access was granted but your session could not be refreshed. Please sign in again.',
      )
    }
  }

  const claims = decodeJwtPayload(accessToken)
  const claimRole = claims?.role ?? null

  if (claimRole && !isAdminRole(claimRole)) {
    throw signInAgainError('Your account now has admin access. Please sign in again to continue.')
  }

  updateSession({ role, roleLabel: formatRole(role), roleVerifiedAt: Date.now() })

  return {
    role,
    roleLabel: formatRole(role),
    message: envelopeMessage(payload) || 'Admin access granted.',
  }
}
