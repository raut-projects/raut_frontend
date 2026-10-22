import { API_ROUTES } from '../lib/config.js'
import { apiGet, apiPost } from './api.js'
import { mapNotification } from './mappers.js'

export async function listNotifications() {
  const data = await apiGet(API_ROUTES.notifications)
  const items = Array.isArray(data) ? data : (data?.items ?? [])

  return items.map(mapNotification)
}

export async function markNotificationRead(notificationId) {
  await apiPost(`${API_ROUTES.notifications}/${notificationId}/read`, {})
}
