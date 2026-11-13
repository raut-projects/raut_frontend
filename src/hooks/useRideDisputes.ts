/**
 * Ride dispute hooks: detail query with 30s polling and resolve/refund mutations.
 * Collaborates with rideDisputes service and toast notifications.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { useToast } from "@/components/toastContext";
import {
  getRideDispute,
  issueRideRefund,
  resolveRideDispute,
} from "@/services/rideDisputes";
import type {
  IssueRideRefundInput,
  ResolveRideDisputeInput,
} from "@/lib/rideDisputes";

/**
 * useRideDispute hook.
 */
export function useRideDispute(rideId: string) {
  return useQuery({
    queryKey: queryKeys.rides.dispute(rideId),
    queryFn: () => getRideDispute(rideId),
    enabled: Boolean(rideId),
    refetchInterval: 30_000,
  });
}

/**
 * useResolveRideDispute hook.
 */
export function useResolveRideDispute() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ rideId, input }: { rideId: string; input: ResolveRideDisputeInput }) =>
      resolveRideDispute(rideId, input),

    onSuccess: (_data, variables) => {
      toast.success("Dispute resolved.");
      queryClient.invalidateQueries({ queryKey: queryKeys.rides.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.rides.dispute(variables.rideId),
      });
    },

    onError: (error) => {
      toast.error(error?.message ?? "Could not resolve the dispute.");
    },
  });
}

/**
 * useIssueRideRefund hook.
 */
export function useIssueRideRefund() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ rideId, input }: { rideId: string; input: IssueRideRefundInput }) =>
      issueRideRefund(rideId, input),

    onSuccess: (_data, variables) => {
      toast.success("Refund issued.");
      queryClient.invalidateQueries({ queryKey: queryKeys.rides.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.rides.dispute(variables.rideId),
      });
    },

    onError: (error) => {
      toast.error(error?.message ?? "Could not issue the refund.");
    },
  });
}
