import {
  API_BASE_URL,
  API_ROUTES,
  REFRESH_TOKEN_FIELD,
  REQUEST_TIMEOUT_MS,
  isApiConfigured,
} from '../lib/config.js'
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  isAccessTokenExpired,
  updateTokens,
} from './tokenStore.js'

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

  if (Array.isArray(body?.detail)) {
    body.detail.forEach((detail) => {
      if (typeof detail?.msg !== 'string' || !detail.msg.trim()) return
      const location = Array.isArray(detail.loc) ? detail.loc.join(' -> ') : ''
      messages.push(location ? `${location}: ${detail.msg.trim()}` : detail.msg.trim())
    })
  }

  return messages
}

export const envelopeMessage = (body) => collectMessages(body)[0] ?? ''

const buildUrl = (path) => {
  if (/^https?:\/\//i.test(path)) return path
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

const readBody = async (response) => {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
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

let refreshInFlight = null

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
  return refreshed ? getAccessToken() : token
}

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
    if (auth && response.status === 401 && allowRefresh) {
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        return request(path, { method, body, auth, timeout, allowRefresh: false, form })
      }
      clearSession()
    }

    throw new ApiError(pickErrorMessage(payload, response.status), response.status, payload)
  }

  if (payload && payload.success === false) {
    throw new ApiError(pickErrorMessage(payload, response.status), response.status, payload)
  }

  return payload
}

export default request
