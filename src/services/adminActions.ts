// Admin moderation actions for drivers, rides, routes and user accounts.
// Thin service layer over the PUT/DELETE helpers in `./api`; every call targets
// an admin-only API_ROUTES endpoint and rejects with ApiError when the backend
// refuses the change.

import { API_ROUTES } from "../lib/config";
import { apiDelete, apiPut } from "./api";

/**
 * Approves a driver application.
 * PUT /drivers/:driverId/verify with an empty body.
 * Resolves with the unwrapped response payload.
 * Throws ApiError when the request fails or the API is not configured.
 */
export const verifyDriver = (driverId) =>
  apiPut(`${API_ROUTES.drivers}/${driverId}/verify`, {});

/**
 * Rejects a driver application with a reason.
 * PUT /drivers/:driverId/reject with `{ reason }`.
 * Throws ApiError on failure.
 */
export const rejectDriver = (driverId, reason) =>
  apiPut(`${API_ROUTES.drivers}/${driverId}/reject`, { reason });

/**
 * Suspends an already verified driver with a reason.
 * PUT /drivers/:driverId/suspend with `{ reason }`.
 * Throws ApiError on failure.
 */
export const suspendDriver = (driverId, reason) =>
  apiPut(`${API_ROUTES.drivers}/${driverId}/suspend`, { reason });

/**
 * Lifts a suspension from a driver.
 * PUT /drivers/:driverId/unsuspend with an empty body.
 * Throws ApiError on failure.
 */
export const unsuspendDriver = (driverId) =>
  apiPut(`${API_ROUTES.drivers}/${driverId}/unsuspend`, {});

/**
 * Cancels a ride and optionally refunds the customer.
 * PUT /rides/:rideId/cancel with `{ reason, refund }`.
 * Throws ApiError on failure.
 */
export const cancelRide = (rideId, reason, refund = true) =>
  apiPut(`${API_ROUTES.rides}/${rideId}/cancel`, { reason, refund });

/**
 * Cancels a scheduled route and optionally its active rides.
 * PUT /routes/:routeId/cancel with `{ reason, cancel_rides }`.
 * Throws ApiError on failure.
 */
export const cancelRoute = (routeId, reason, cancelRides = true) =>
  apiPut(`${API_ROUTES.routes}/${routeId}/cancel`, {
    reason,
    cancel_rides: cancelRides,
  });

/**
 * Changes an account's role.
 * PUT /users/:userId/role with `{ role }`.
 * Throws ApiError on failure.
 */
export const setUserRole = (userId, role) =>
  apiPut(`${API_ROUTES.users}/${userId}/role`, { role });

/**
 * Deactivates an account, optionally recording a reason.
 * PUT /users/:userId/deactivate with `{ reason }` or an empty body.
 * Throws ApiError on failure.
 */
export const deactivateUser = (userId, reason) =>
  apiPut(`${API_ROUTES.users}/${userId}/deactivate`, reason ? { reason } : {});

/**
 * Re-enables a previously deactivated account.
 * PUT /users/:userId/reactivate with an empty body.
 * Throws ApiError on failure.
 */
export const reactivateUser = (userId) =>
  apiPut(`${API_ROUTES.users}/${userId}/reactivate`, {});

/**
 * Permanently deletes an account.
 * DELETE /users/:userId.
 * Throws ApiError on failure.
 */
export const deleteUser = (userId) =>
  apiDelete(`${API_ROUTES.users}/${userId}`);
