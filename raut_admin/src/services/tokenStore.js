const SESSION_KEY = 'raut_admin_session'
const ACCESS_TOKEN_KEY = 'raut_admin_access_token'
const REFRESH_TOKEN_KEY = 'raut_admin_refresh_token'
const EXPIRES_AT_KEY = 'raut_admin_access_expires_at'

const listeners = new Set()

const read = (key) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const write = (key, value) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Storage can be unavailable (private mode). The session then lives in memory only.
  }
}

const remove = (key) => {
  try {
    localStorage.removeItem(key)
  } catch {
    // Ignore storage failures, the in-memory state is cleared either way.
  }
}

const readSession = () => {
  const raw = read(SESSION_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

let cachedSession = readSession()

export const getSessionSnapshot = () => cachedSession

export const subscribeSession = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const emit = () => {
  cachedSession = readSession()
  listeners.forEach((listener) => listener())
}

const computeExpiresAt = (expiresIn) => {
  const seconds = Number(expiresIn)
  if (!Number.isFinite(seconds) || seconds <= 0) return 0
  return Date.now() + seconds * 1000
}

export const saveSession = ({ session, accessToken, refreshToken, expiresIn }) => {
  write(SESSION_KEY, JSON.stringify(session))
  write(ACCESS_TOKEN_KEY, accessToken ?? '')
  write(REFRESH_TOKEN_KEY, refreshToken ?? '')
  write(EXPIRES_AT_KEY, String(computeExpiresAt(expiresIn)))
  emit()
}

export const updateTokens = ({ accessToken, refreshToken, expiresIn } = {}) => {
  if (accessToken !== undefined && accessToken !== null) {
    write(ACCESS_TOKEN_KEY, accessToken)
  }

  if (refreshToken !== undefined && refreshToken !== null) {
    write(REFRESH_TOKEN_KEY, refreshToken)
  }

  const expiresAt = computeExpiresAt(expiresIn)
  if (expiresAt) write(EXPIRES_AT_KEY, String(expiresAt))

  emit()
}

export const updateSession = (patch) => {
  const current = readSession()
  if (!current) return

  write(SESSION_KEY, JSON.stringify({ ...current, ...patch }))
  emit()
}

export const clearSession = () => {
  remove(SESSION_KEY)
  remove(ACCESS_TOKEN_KEY)
  remove(REFRESH_TOKEN_KEY)
  remove(EXPIRES_AT_KEY)
  emit()
}

export const getAccessToken = () => read(ACCESS_TOKEN_KEY) || null

export const getRefreshToken = () => read(REFRESH_TOKEN_KEY) || null

export const getExpiresAt = () => Number(read(EXPIRES_AT_KEY)) || 0

export const isAccessTokenExpired = () => {
  const expiresAt = getExpiresAt()
  if (!expiresAt) return false
  return Date.now() >= expiresAt
}
