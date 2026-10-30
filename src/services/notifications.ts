import { API_ROUTES } from '../lib/config'
import { apiGet, apiPost } from './api'
import { mapNotification } from './mappers'

export async function listNotifications() {
  const data = await apiGet(API_ROUTES.notifications)
  const items = Array.isArray(data) ? data : (data?.items ?? [])

  return items.map(mapNotification)
}

export async function markNotificationRead(notificationId) {
  await apiPost(`${API_ROUTES.notifications}/${notificationId}/read`, {})
}
