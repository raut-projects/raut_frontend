/**
 * Ride list and summary hooks with 30s/60s polling and keep-previous data.
 * Collaborates with rides service and queryKeys.
 */
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getRideSummary, listRides } from "../services/rides";
import { queryKeys } from "../lib/queryKeys";

/**
 * useRides hook.
 */
export function useRides(params) {
  return useQuery({
    queryKey: queryKeys.rides.list(params),
    queryFn: () => listRides(params),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });
}

/**
 * useRideSummary hook.
 */
export function useRideSummary() {
  return useQuery({
    queryKey: queryKeys.rides.summary,
    queryFn: getRideSummary,
    refetchInterval: 60_000,
  });
}
