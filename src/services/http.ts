// HTTP transport for the admin console.
// Builds URLs, injects bearer tokens, serialises JSON or form bodies, applies a
// timeout, performs single-flight refresh on expiry or 401, and normalises both
// success and error envelopes into ApiError. Every service helper goes through
// `request`, so retry and auth behaviour lives in one place.

import {
  API_BASE_URL,
  API_ROUTES,
  REFRESH_TOKEN_FIELD,
  REQUEST_TIMEOUT_MS,
  isApiConfigured,
} from '../lib/config'
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  isAccessTokenExpired,
  updateTokens,
} from './tokenStore'
import { resetClientState } from '../store/resetClientState'

/**
 * Error thrown for transport, configuration and non-2xx API responses.
 * `status` is the HTTP status (0 for network/timeout/configuration failures) and
 * `body` is the parsed response payload when one was available.
 */
export class ApiError extends Error {
  status: number
  body: any
  constructor(message: string, status = 0, body: any = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

/**
 * Unwraps the standard `{ data: ... }` response envelope.
 * Returns `body.data` when the body is a non-array object with a `data` key,
 * otherwise the body unchanged (including null).
 */
export const envelopeData = (body) =>
  body && typeof body === 'object' && 'data' in body ? body.data : body

const collectMessages = (body) => {
  const messages = []

  if (typeof body?.message === 'string' && body.message.trim()) {
    messages.push(body.message.trim())
  }

  if (typeof body?.error?.message === 'string' && body.error.message.trim()) {
    messages.push(body.error.message.trim())
  }

  if (typeof body?.detail === 'string' && body.detail.trim()) {
    messages.push(body.detail.trim())
  }

  const details = Array.isArray(body?.error?.details)
    ? body.error.details
    : Array.isArray(body?.details)
      ? body.details
      : []

  details.forEach((detail) => {
    if (typeof detail?.message !== 'string' || !detail.message.trim()) return
    messages.push(detail.field ? `${detail.field}: ${detail.message.trim()}` : detail.message.trim())
  })

  // FastAPI-style validation errors put entries in `detail` as an array.
  if (Array.isArray(body?.detail)) {
    body.detail.forEach((detail) => {
      if (typeof detail?.msg !== 'string' || !detail.msg.trim()) return
      const location = Array.isArray(detail.loc) ? detail.loc.join(' -> ') : ''
      messages.push(location ? `${location}: ${detail.msg.trim()}` : detail.msg.trim())
    })
  }

  return messages
}

/**
 * Returns the first human-readable message from a response envelope.
 * Supports `message`, `error.message`, `detail`, structured `details` and
 * FastAPI validation arrays. Returns an empty string when none is present.
 */
export const envelopeMessage = (body) => collectMessages(body)[0] ?? ''

const buildUrl = (path) => {
  // Absolute URLs bypass API_BASE_URL so callers can target another host.
  if (/^https?:\/\//i.test(path)) return path
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

const readBody = async (response) => {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    // Non-JSON responses (proxies, HTML error pages) still need a usable message.
    return { message: text }
  }
}

const pickErrorMessage = (body, status) => {
  const [message, ...details] = collectMessages(body)

  if (message) {
    return details.length ? `${message} (${details.join(', ')})` : message
  }

  if (status === 404) return 'The requested endpoint was not found.'
  if (status === 422) return 'The request was rejected. Please check the details and try again.'
  if (status === 429) return 'Too many attempts. Please wait a moment and try again.'
  if (status >= 500) return 'The server ran into a problem. Please try again.'
  return 'Something went wrong. Please try again.'
}

// Shared promise so concurrent 401s start a single refresh instead of one each.
let refreshInFlight = null

/**
 * Refreshes the access token using the stored refresh token.
 * POSTs to API_ROUTES.refresh with the configured refresh-token field, unauthed,
 * then stores any returned access/refresh token and expiry.
 * Concurrent callers share one in-flight request; the slot is cleared in
 * `finally` so a later call can try again.
 * Returns true when a new access token was stored, false when there is no
 * refresh token, the response carried no token, or the request failed.
 */
export const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const payload: any = await request(API_ROUTES.refresh, {
          method: 'POST',
          body: { [REFRESH_TOKEN_FIELD]: refreshToken },
          auth: false,
        }) as any

        const data = envelopeData(payload) ?? {}
        const accessToken = data.access_token ?? data.accessToken ?? data.token

        if (!accessToken) return false

        updateTokens({
          accessToken,
          refreshToken: data.refresh_token ?? data.refreshToken ?? undefined,
          expiresIn: data.expires_in ?? data.expiresIn ?? null,
        })

        return true
      } catch {
        return false
      } finally {
        refreshInFlight = null
      }
    })()
  }

  return refreshInFlight
}

const ensureFreshToken = async () => {
  const token = getAccessToken()
  if (!token) return null
  if (!isAccessTokenExpired()) return token

  const refreshed = await refreshAccessToken()
  // If refresh fails, keep the old token so the request still runs and the 401
  // handler can decide whether to sign the user out.
  return refreshed ? getAccessToken() : token
}

/**
 * Performs one API request and normalises the outcome.
 *
 * Lifecycle:
 * 1. Rejects early (ApiError, status 0) when the base URL is not configured.
 * 2. Builds the URL from API_BASE_URL (or uses an absolute path as-is).
 * 3. Serialises a JSON body, or form-urlencoded when `form` is true.
 * 4. With `auth`, reads the token store, refreshing first when the stored token
 *    is expired, and adds `Authorization: Bearer ...` when a token exists.
 * 5. Attaches an AbortController timer; an abort becomes a timeout ApiError.
 * 6. Parses JSON, falling back to `{ message: text }` for non-JSON bodies.
 * 7. On 401 with `allowRefresh`, attempts one single-flight refresh and retries
 *    once with `allowRefresh: false`; if that fails, clears the session and
 *    client state before throwing.
 * 8. Treats `{ success: false }` as an error even on HTTP 200.
 *
 * @param path API path (joined to API_BASE_URL) or absolute URL.
 * @param options.method HTTP method, default GET.
 * @param options.body Request payload; JSON unless `form` is true.
 * @param options.auth Whether to attach the bearer token (default false).
 * @param options.timeout Abort timeout in ms, default REQUEST_TIMEOUT_MS.
 * @param options.allowRefresh Whether a 401 may trigger a token refresh.
 * @param options.form Send `body` as application/x-www-form-urlencoded.
 * @returns The parsed response payload without unwrapping the `data` envelope.
 * @throws ApiError for configuration, network, timeout and non-2xx responses.
 */
export const request = async (
  path: string,
  {
    method = 'GET',
    body,
    auth = false,
    timeout = REQUEST_TIMEOUT_MS,
    allowRefresh = true,
    form = false,
  }: any = {},
) => {
  if (!isApiConfigured) {
    throw new ApiError(
      'Please check your internet connection and try again',
      0,
      null,
    )
  }

  const headers: Record<string, string> = { Accept: 'application/json' }
  let requestBody: BodyInit | undefined = undefined

  if (body !== undefined) {
    if (form) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8'
      requestBody = new URLSearchParams(body as Record<string, string>).toString()
    } else {
      headers['Content-Type'] = 'application/json'
      requestBody = JSON.stringify(body)
    }
  }

  if (auth) {
    const token = await ensureFreshToken()
    if (token) (headers as any).Authorization = `Bearer ${token}`
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  let response

  try {
    response = await fetch(buildUrl(path), {
      method,
      headers,
      body: requestBody,
      signal: controller.signal,
    })
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new ApiError('The server took too long to respond. Please try again.', 0, null)
    }
    throw new ApiError('Something went wrong. Please check your connection.', 0, null)
  } finally {
    clearTimeout(timer)
  }

  const payload = await readBody(response)

  if (!response.ok) {
    // One retry only: allowRefresh is false on the retried call, so a backend
    // that keeps returning 401 cannot loop.
    if (auth && response.status === 401 && allowRefresh) {
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        return request(path, { method, body, auth, timeout, allowRefresh: false, form })
      }
      clearSession()
      resetClientState()
    }

    throw new ApiError(pickErrorMessage(payload, response.status), response.status, payload)
  }

  // Some endpoints report business failures with HTTP 200 and `success: false`.
  if (payload && payload.success === false) {
    throw new ApiError(pickErrorMessage(payload, response.status), response.status, payload)
  }

  return payload
}

export default request
