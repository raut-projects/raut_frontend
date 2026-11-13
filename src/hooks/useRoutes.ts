/**
 * Route list and summary hooks with 30s/60s polling and keep-previous data.
 * Collaborates with routes service and queryKeys.
 */
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { getRouteSummary, listRoutes } from "../services/routes";

/**
 * useRoutes hook.
 */
export function useRoutes(params) {
  return useQuery({
    queryKey: queryKeys.routes.list(params),
    queryFn: () => listRoutes(params),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });
}

/**
 * useRouteSummary hook.
 */
export function useRouteSummary() {
  return useQuery({
    queryKey: queryKeys.routes.summary,
    queryFn: getRouteSummary,
    refetchInterval: 60_000,
  });
}
