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

export const useVerifyDriver = () =>
  useAction({
    mutationFn: ({ driverId }) => verifyDriver(driverId),
    successMessage: "Driver verified.",
  });

export const useRejectDriver = () =>
  useAction({
    mutationFn: ({ driverId, reason }) => rejectDriver(driverId, reason),
    successMessage: "Driver application rejected.",
  });

export const useSuspendDriver = () =>
  useAction({
    mutationFn: ({ driverId, reason }) => suspendDriver(driverId, reason),
    successMessage: "Driver suspended.",
  });

export const useUnsuspendDriver = () =>
  useAction({
    mutationFn: ({ driverId }) => unsuspendDriver(driverId),
    successMessage: "Driver reinstated.",
  });

export const useCancelRide = () =>
  useAction({
    mutationFn: ({ rideId, reason, refund }) =>
      cancelRide(rideId, reason, refund),
    successMessage: "Ride cancelled.",
    invalidate: [queryKeys.rides.all],
  });

export const useCancelRoute = () =>
  useAction({
    mutationFn: ({ routeId, reason, cancelRides }) =>
      cancelRoute(routeId, reason, cancelRides),
    successMessage: "Route cancelled.",
    invalidate: [queryKeys.routes.all, queryKeys.rides.all],
  });

export const useApproveDocument = () =>
  useAction({
    mutationFn: ({ documentId }) => approveDocument(documentId, ""),
    successMessage: "Document approved.",
    invalidate: [queryKeys.documents.all],
  });

export const useRejectDocument = () =>
  useAction({
    mutationFn: ({ documentId, reason }) => rejectDocument(documentId, reason),
    successMessage: "Document rejected.",
    invalidate: [queryKeys.documents.all],
  });

export const useApprovePayout = () =>
  useAction({
    mutationFn: ({ payoutId, notes }) => approvePayout(payoutId, notes),
    successMessage: "Payout approved.",
    invalidate: [queryKeys.payouts.all],
  });

export const useRejectPayout = () =>
  useAction({
    mutationFn: ({ payoutId, reason }) => rejectPayout(payoutId, reason),
    successMessage: "Payout rejected.",
    invalidate: [queryKeys.payouts.all],
  });

export const useRetryPayout = () =>
  useAction({
    mutationFn: ({ payoutId }) => retryPayout(payoutId),
    successMessage: "Payout queued for another attempt.",
    invalidate: [queryKeys.payouts.all],
  });

export const useSetUserRole = () =>
  useAction({
    mutationFn: ({ userId, role }) => setUserRole(userId, role),
    successMessage: ({ role }) => `Role changed to ${role.replace("_", " ")}.`,
  });

export const useDeactivateUser = () =>
  useAction({
    mutationFn: ({ userId, reason }) => deactivateUser(userId, reason),
    successMessage: "Account deactivated.",
  });

export const useReactivateUser = () =>
  useAction({
    mutationFn: ({ userId }) => reactivateUser(userId),
    successMessage: "Account reactivated.",
  });

export const useDeleteUser = () =>
  useAction({
    mutationFn: ({ userId }) => deleteUser(userId),
    successMessage: "Account deleted.",
  });
