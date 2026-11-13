// Notification service.
// Fetches the signed-in user's notifications and marks them read. Requests go
// through `./api`, so failures reject with ApiError.

import { API_ROUTES } from '../lib/config'
import { apiGet, apiPost } from './api'
import { mapNotification } from './mappers'

/**
 * Lists notifications for the current user.
 * GET /notifications (API_ROUTES.notifications). Accepts either a bare array or
 * `{ items }` and maps each entry for display.
 * Returns an empty array when nothing is returned. Throws ApiError on failure.
 */
export async function listNotifications() {
  const data = await apiGet(API_ROUTES.notifications)
  const items = Array.isArray(data) ? data : (data?.items ?? [])

  return items.map(mapNotification)
}

/**
 * Marks one notification as read.
 * POST /notifications/:notificationId/read with an empty body.
 * Returns nothing; throws ApiError on failure.
 */
export async function markNotificationRead(notificationId) {
  await apiPost(`${API_ROUTES.notifications}/${notificationId}/read`, {})
}
