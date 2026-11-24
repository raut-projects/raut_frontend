/**
 * Admin action mutations for the operations dashboard.
 * Wraps driver, ride, route, document, payout and user-management service
 * calls in React Query mutations with shared toast feedback and cache
 * invalidation. Collaborates with queryKeys, the toast context and the
 * adminActions/documents/payouts service modules.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../components/toastContext";
import { queryKeys } from "../lib/queryKeys";
import {
  cancelRide,
  cancelRoute,
  deactivateUser,
  deleteUser,
  reactivateUser,
  rejectDriver,
  setUserRole,
  suspendDriver,
  unsuspendDriver,
  verifyDriver,
} from "../services/adminActions";
import { approveDocument, rejectDocument } from "../services/documents";
import { approvePayout, rejectPayout, retryPayout } from "../services/payouts";

/**
 * Shared mutation factory for simple admin actions.
 *
 * Always invalidates the aggregate customers, drivers and dashboard caches so
 * lists and counters reflect the action, then invalidates any extra keys
 * supplied by the caller. Errors surface through the toast context.
 */
const useAction = ({ mutationFn, successMessage, invalidate = [] }) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn,

    onSuccess: (_data, variables) => {
      toast.success(
        typeof successMessage === "function"
          ? successMessage(variables)
          : successMessage,
      );

      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });

      invalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
    },

    onError: (error) => {
      toast.error(error?.message ?? "The action could not be completed.");
    },
  });
};

/**
 * Verifies a pending driver application.
 *
 * Variables: `{ driverId }`. Invalidates the shared admin caches via
 * `useAction` and shows a confirmation toast.
 *
 * @returns A React Query mutation; call `mutate({ driverId })`.
 */
export const useVerifyDriver = () =>
  useAction({
    mutationFn: ({ driverId }) => verifyDriver(driverId),
    successMessage: "Driver verified.",
  });

/**
 * Rejects a pending driver application with a reason.
 *
 * Variables: `{ driverId, reason }`. Invalidates the shared admin caches and
 * shows a confirmation toast.
 *
 * @returns A React Query mutation; call `mutate({ driverId, reason })`.
 */
export const useRejectDriver = () =>
  useAction({
    mutationFn: ({ driverId, reason }) => rejectDriver(driverId, reason),
    successMessage: "Driver application rejected.",
  });

/**
 * Suspends an active driver with a reason.
 *
 * Variables: `{ driverId, reason }`. Invalidates the shared admin caches and
 * shows a confirmation toast.
 *
 * @returns A React Query mutation; call `mutate({ driverId, reason })`.
 */
export const useSuspendDriver = () =>
  useAction({
    mutationFn: ({ driverId, reason }) => suspendDriver(driverId, reason),
    successMessage: "Driver suspended.",
  });

/**
 * Reinstates a suspended driver.
 *
 * Variables: `{ driverId }`. Invalidates the shared admin caches and shows a
 * confirmation toast.
 *
 * @returns A React Query mutation; call `mutate({ driverId })`.
 */
export const useUnsuspendDriver = () =>
  useAction({
    mutationFn: ({ driverId }) => unsuspendDriver(driverId),
    successMessage: "Driver reinstated.",
  });

/**
 * Cancels a ride, optionally with a reason and refund.
 *
 * Variables: `{ rideId, reason, refund }`. Invalidates `rides.all` in addition
 * to the shared admin caches.
 *
 * @returns A React Query mutation; call `mutate({ rideId, reason, refund })`.
 */
export const useCancelRide = () =>
  useAction({
    mutationFn: ({ rideId, reason, refund }) =>
      cancelRide(rideId, reason, refund),
    successMessage: "Ride cancelled.",
    invalidate: [queryKeys.rides.all],
  });

/**
 * Cancels a route and optionally its affected rides.
 *
 * Variables: `{ routeId, reason, cancelRides }`. Invalidates `routes.all` and
 * `rides.all` in addition to the shared admin caches.
 *
 * @returns A React Query mutation; call `mutate({ routeId, reason, cancelRides })`.
 */
export const useCancelRoute = () =>
  useAction({
    mutationFn: ({ routeId, reason, cancelRides }) =>
      cancelRoute(routeId, reason, cancelRides),
    successMessage: "Route cancelled.",
    invalidate: [queryKeys.routes.all, queryKeys.rides.all],
  });

/**
 * Approves a driver document with optional notes.
 *
 * Variables: `{ documentId, notes }`. Invalidates `documents.all` in addition
 * to the shared admin caches.
 *
 * @returns A React Query mutation; call `mutate({ documentId, notes })`.
 */
export const useApproveDocument = () =>
  useAction({
    mutationFn: ({ documentId, notes }) => approveDocument(documentId, notes),
    successMessage: "Document approved.",
    invalidate: [queryKeys.documents.all, queryKeys.drivers.all],
  });

/**
 * Rejects a driver document with a reason.
 *
 * Variables: `{ documentId, reason }`. Invalidates `documents.all` in addition
 * to the shared admin caches.
 *
 * @returns A React Query mutation; call `mutate({ documentId, reason })`.
 */
export const useRejectDocument = () =>
  useAction({
    mutationFn: ({ documentId, reason }) => rejectDocument(documentId, reason),
    successMessage: "Document rejected.",
    invalidate: [queryKeys.documents.all, queryKeys.drivers.all],
  });

/**
 * Approves a single payout with optional notes.
 *
 * Variables: `{ payoutId, notes }`. Invalidates `payouts.all` in addition to
 * the shared admin caches.
 *
 * @returns A React Query mutation; call `mutate({ payoutId, notes })`.
 */
export const useApprovePayout = () =>
  useAction({
    mutationFn: ({ payoutId, notes }) => approvePayout(payoutId, notes),
    successMessage: "Payout approved.",
    invalidate: [queryKeys.payouts.all],
  });

type BatchPayout = {
  id: string | number;
  driverName: string;
  amount: number;
};

type BatchPayoutResult = {
  payoutId: string | number;
  status: "approved" | "failed";
  message?: string;
};

type BatchPayoutProgress =
  | BatchPayoutResult
  | {
      payoutId: string | number;
      status: "processing";
    };

type ApprovePayoutBatchVariables = {
  payouts: BatchPayout[];
  onProgress?: (progress: BatchPayoutProgress) => void;
};

/**
 * Approves payouts sequentially so one failure does not abort the batch.
 *
 * Variables: `{ payouts, onProgress? }`. Each payout reports `processing` and
 * then `approved` or `failed` through `onProgress`. The mutation resolves with
 * a result per payout, invalidates `payouts.all` and `dashboard.all`, and
 * shows a partial-success toast when any approval failed.
 *
 * @returns A React Query mutation exposing the per-payout results to callers.
 */
export function useApprovePayoutBatch() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation<BatchPayoutResult[], Error, ApprovePayoutBatchVariables>({
    mutationFn: async ({ payouts, onProgress }) => {
      const results = [];

      // Sequential on purpose: the backend approves one payout at a time and
      // progress callbacks must preserve the caller's ordering.
      for (const payout of payouts) {
        onProgress?.({
          payoutId: payout.id,
          status: "processing" as const,
        });

        try {
          await approvePayout(payout.id, "Batch approval");
          const result: BatchPayoutResult = {
            payoutId: payout.id,
            status: "approved",
          };
          results.push(result);
          onProgress?.(result);
        } catch (error) {
          const result: BatchPayoutResult = {
            payoutId: payout.id,
            status: "failed",
            message: error?.message ?? "Approval failed.",
          };
          results.push(result);
          onProgress?.(result);
        }
      }

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payouts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });

      const approved = results.filter(
        (result) => result.status === "approved",
      ).length;
      const failed = results.length - approved;

      if (failed > 0) {
        toast.error(
          `${approved} payout${approved === 1 ? "" : "s"} approved. ${failed} failed and need review.`,
        );
      } else {
        toast.success(
          `${approved} payout${approved === 1 ? "" : "s"} approved.`,
        );
      }
    },
  });
}

/**
 * Rejects a payout with a reason.
 *
 * Variables: `{ payoutId, reason }`. Invalidates `payouts.all` in addition to
 * the shared admin caches.
 *
 * @returns A React Query mutation; call `mutate({ payoutId, reason })`.
 */
export const useRejectPayout = () =>
  useAction({
    mutationFn: ({ payoutId, reason }) => rejectPayout(payoutId, reason),
    successMessage: "Payout rejected.",
    invalidate: [queryKeys.payouts.all],
  });

/**
 * Queues a failed payout for another processing attempt.
 *
 * Variables: `{ payoutId }`. Invalidates `payouts.all` in addition to the
 * shared admin caches.
 *
 * @returns A React Query mutation; call `mutate({ payoutId })`.
 */
export const useRetryPayout = () =>
  useAction({
    mutationFn: ({ payoutId }) => retryPayout(payoutId),
    successMessage: "Payout queued for another attempt.",
    invalidate: [queryKeys.payouts.all],
  });

/**
 * Changes a user's platform role.
 *
 * Variables: `{ userId, role }`. The success toast formats the returned role
 * name. Invalidates the shared admin caches.
 *
 * @returns A React Query mutation; call `mutate({ userId, role })`.
 */
export const useSetUserRole = () =>
  useAction({
    mutationFn: ({ userId, role }) => setUserRole(userId, role),
    successMessage: ({ role }) => `Role changed to ${role.replace("_", " ")}.`,
  });

/**
 * Deactivates a user account with an optional reason.
 *
 * Variables: `{ userId, reason }`. Invalidates the shared admin caches.
 *
 * @returns A React Query mutation; call `mutate({ userId, reason })`.
 */
export const useDeactivateUser = () =>
  useAction({
    mutationFn: ({ userId, reason }) => deactivateUser(userId, reason),
    successMessage: "Account deactivated.",
  });

/**
 * Reactivates a previously deactivated user account.
 *
 * Variables: `{ userId }`. Invalidates the shared admin caches.
 *
 * @returns A React Query mutation; call `mutate({ userId })`.
 */
export const useReactivateUser = () =>
  useAction({
    mutationFn: ({ userId }) => reactivateUser(userId),
    successMessage: "Account reactivated.",
  });

/**
 * Permanently deletes a user account.
 *
 * Variables: `{ userId }`. Invalidates the shared admin caches.
 *
 * @returns A React Query mutation; call `mutate({ userId })`.
 */
export const useDeleteUser = () =>
  useAction({
    mutationFn: ({ userId }) => deleteUser(userId),
    successMessage: "Account deleted.",
  });
