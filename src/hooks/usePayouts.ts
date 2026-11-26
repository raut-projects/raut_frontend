/**
 * Payout queries for the finance dashboard.
 * Lists payouts with 30s polling and pending-batch review aggregation.
 * Collaborates with payouts service and queryKeys.
 */
import { useCallback, useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getPayoutFailureCounts,
  listPendingPayoutBatch,
  listPayoutBatchProcessing,
  listPayouts,
  withPayoutReviewIssues,
} from "../services/payouts";
import { queryKeys } from "../lib/queryKeys";
import { polledQueryOptions } from "../lib/queryClient";

/**
 * usePayouts hook.
 */
export function usePayouts(params) {
  return useQuery({
    queryKey: queryKeys.payouts.list(params),
    queryFn: ({ signal }) => listPayouts(params, { signal }),
    placeholderData: keepPreviousData,
    ...polledQueryOptions,
    refetchInterval: 30_000,
  });
}

/**
 * usePendingPayouts hook.
 */
export function usePendingPayouts() {
  return useQuery({
    queryKey: queryKeys.payouts.batchReview,
    queryFn: ({ signal }) => listPendingPayoutBatch({ signal }),
    ...polledQueryOptions,
    refetchInterval: 30_000,
  });
}

/**
 * usePayoutBatchReview hook.
 */
export function usePayoutBatchReview() {
  const pendingQuery = useQuery({
    queryKey: queryKeys.payouts.batchReview,
    queryFn: ({ signal }) => listPendingPayoutBatch({ signal }),
    ...polledQueryOptions,
    refetchInterval: 30_000,
  });
  const processingQuery = useQuery({
    queryKey: queryKeys.payouts.batchProcessing,
    queryFn: ({ signal }) => listPayoutBatchProcessing({ signal }),
    ...polledQueryOptions,
    refetchInterval: 10_000,
  });
  const failuresQuery = useQuery({
    queryKey: queryKeys.payouts.batchFailures,
    queryFn: ({ signal }) => getPayoutFailureCounts({ signal }),
    staleTime: 5 * 60_000,
    ...polledQueryOptions,
    refetchInterval: 5 * 60_000,
  });

  const { refetch: refetchPending } = pendingQuery;
  const { refetch: refetchProcessing } = processingQuery;
  const { refetch: refetchFailures } = failuresQuery;

  const data = useMemo(
    () =>
      pendingQuery.data && processingQuery.data && failuresQuery.data
        ? {
            pending: pendingQuery.data.map((payout) =>
              withPayoutReviewIssues(payout, failuresQuery.data),
            ),
            processing: processingQuery.data,
          }
        : undefined,
    [pendingQuery.data, processingQuery.data, failuresQuery.data],
  );

  const refetch = useCallback(async () => {
    const [pending, processing, failures] = await Promise.all([
      refetchPending(),
      refetchProcessing(),
      refetchFailures(),
    ]);

    if (pending.error || processing.error || failures.error) {
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
  }, [refetchPending, refetchProcessing, refetchFailures]);

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
