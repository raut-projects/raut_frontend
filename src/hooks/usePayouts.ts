/**
 * Payout queries for the finance dashboard.
 * Lists payouts with 30s polling and pending-batch review aggregation.
 * Collaborates with payouts service and queryKeys.
 */
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getPayoutFailureCounts,
  listPendingPayoutBatch,
  listPayoutBatchProcessing,
  listPayouts,
  withPayoutReviewIssues,
} from "../services/payouts";
import { queryKeys } from "../lib/queryKeys";

/**
 * usePayouts hook.
 */
export function usePayouts(params) {
  return useQuery({
    queryKey: queryKeys.payouts.list(params),
    queryFn: () => listPayouts(params),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });
}

/**
 * usePendingPayouts hook.
 */
export function usePendingPayouts() {
  return useQuery({
    queryKey: queryKeys.payouts.batchReview,
    queryFn: listPendingPayoutBatch,
    refetchInterval: 30_000,
  });
}

/**
 * usePayoutBatchReview hook.
 */
export function usePayoutBatchReview() {
  const pendingQuery = useQuery({
    queryKey: queryKeys.payouts.batchReview,
    queryFn: listPendingPayoutBatch,
    refetchInterval: 30_000,
  });
  const processingQuery = useQuery({
    queryKey: queryKeys.payouts.batchProcessing,
    queryFn: listPayoutBatchProcessing,
    refetchInterval: 10_000,
  });
  const failuresQuery = useQuery({
    queryKey: queryKeys.payouts.batchFailures,
    queryFn: getPayoutFailureCounts,
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
  });

  const data =
    pendingQuery.data && processingQuery.data && failuresQuery.data
      ? {
          pending: pendingQuery.data.map((payout) =>
            withPayoutReviewIssues(payout, failuresQuery.data),
          ),
          processing: processingQuery.data,
        }
      : undefined;

  const refetch = async () => {
    const [pending, processing, failures] = await Promise.all([
      pendingQuery.refetch(),
      processingQuery.refetch(),
      failuresQuery.refetch(),
    ]);

    if (pending.isError || processing.isError || failures.isError) {
      return { data: undefined };
    }

    return {
      data:
        pending.data && processing.data && failures.data
          ? {
              pending: pending.data.map((payout) =>
                withPayoutReviewIssues(payout, failures.data),
              ),
              processing: processing.data,
            }
          : undefined,
    };
  };

  return {
    data,
    isPending:
      pendingQuery.isPending ||
      processingQuery.isPending ||
      failuresQuery.isPending,
    isError:
      pendingQuery.isError || processingQuery.isError || failuresQuery.isError,
    error: pendingQuery.error ?? processingQuery.error ?? failuresQuery.error,
    isFetching:
      pendingQuery.isFetching ||
      processingQuery.isFetching ||
      failuresQuery.isFetching,
    dataUpdatedAt: Math.max(
      pendingQuery.dataUpdatedAt,
      processingQuery.dataUpdatedAt,
      failuresQuery.dataUpdatedAt,
    ),
    refetch,
  };
}
