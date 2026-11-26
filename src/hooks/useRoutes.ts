/**
 * Route list and summary hooks with 30s/60s polling and keep-previous data.
 * Collaborates with routes service and queryKeys.
 */
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { polledQueryOptions } from "../lib/queryClient";
import { getRouteSummary, listRoutes } from "../services/routes";

/**
 * useRoutes hook.
 */
export function useRoutes(params) {
  return useQuery({
    queryKey: queryKeys.routes.list(params),
    queryFn: ({ signal }) => listRoutes(params, { signal }),
    placeholderData: keepPreviousData,
    ...polledQueryOptions,
    refetchInterval: 30_000,
  });
}

/**
 * useRouteSummary hook.
 */
export function useRouteSummary() {
  return useQuery({
    queryKey: queryKeys.routes.summary,
    queryFn: ({ signal }) => getRouteSummary({ signal }),
    ...polledQueryOptions,
    refetchInterval: 60_000,
  });
}
