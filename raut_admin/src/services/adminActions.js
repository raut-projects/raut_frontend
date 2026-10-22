import { API_ROUTES } from '../lib/config.js'
import { apiPut } from './api.js'

export const verifyDriver = (driverId) => apiPut(`${API_ROUTES.riders}/${driverId}/verify`, {})

export const rejectDriver = (driverId, reason) =>
  apiPut(`${API_ROUTES.riders}/${driverId}/reject`, { reason })

export const suspendDriver = (driverId, reason) =>
  apiPut(`${API_ROUTES.riders}/${driverId}/suspend`, { reason })

export const unsuspendDriver = (driverId) => apiPut(`${API_ROUTES.riders}/${driverId}/unsuspend`, {})

export const setUserRole = (userId, role) => apiPut(`${API_ROUTES.users}/${userId}/role`, { role })

export const deactivateUser = (userId, reason) =>
  apiPut(`${API_ROUTES.users}/${userId}/deactivate`, reason ? { reason } : {})

export const reactivateUser = (userId) => apiPut(`${API_ROUTES.users}/${userId}/reactivate`, {})
