import { getToken } from './auth.js'

export const LATENCY = 400

export const wait = (ms = LATENCY) => new Promise((resolve) => setTimeout(resolve, ms))

export const requestError = (message, status = 500) => {
  const error = new Error(message)
  error.status = status
  return error
}

export const matches = (value, query) => value.toLowerCase().includes(query)

export const today = () =>
  new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export const authHeaders = () => {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const requireSession = () => {
  if (!getToken()) {
    throw requestError('Your session has expired. Please sign in again.', 401)
  }
}
