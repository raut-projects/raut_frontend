/**
 * Ride list and summary hooks with 30s/60s polling and keep-previous data.
 * Collaborates with rides service and queryKeys.
 */
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getRideSummary, listRides } from "../services/rides";
import { queryKeys } from "../lib/queryKeys";
import { polledQueryOptions } from "../lib/queryClient";

/**
 * useRides hook.
 */
export function useRides(params) {
  return useQuery({
    queryKey: queryKeys.rides.list(params),
    queryFn: ({ signal }) => listRides(params, { signal }),
    placeholderData: keepPreviousData,
    ...polledQueryOptions,
    refetchInterval: 30_000,
  });
}

/**
 * useRideSummary hook.
 */
export function useRideSummary() {
  return useQuery({
    queryKey: queryKeys.rides.summary,
    queryFn: ({ signal }) => getRideSummary({ signal }),
    ...polledQueryOptions,
    refetchInterval: 60_000,
  });
}
