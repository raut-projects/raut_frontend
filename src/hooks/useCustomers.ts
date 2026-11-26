/**
 * Customer directory queries for the operations dashboard.
 * Exposes a filtered, paginated customer list and aggregate customer stats.
 * Collaborates with the customers service and queryKeys.
 */
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getCustomerStats, listCustomers } from "../services/customers";
import { queryKeys } from "../lib/queryKeys";
import { polledQueryOptions } from "../lib/queryClient";

/**
 * Lists customers for the supplied filters.
 *
 * Query key: `customers.list(params)`. Keeps the previous page rendered while
 * new filters load and polls every 60 seconds to pick up account changes.
 *
 * @param params - Search, status and pagination filters.
 * @returns A React Query result containing the customer page.
 */
export function useCustomers(params) {
  return useQuery({
    queryKey: queryKeys.customers.list(params),
    queryFn: ({ signal }) => listCustomers(params, { signal }),
    placeholderData: keepPreviousData,
    ...polledQueryOptions,
    refetchInterval: 60_000,
  });
}

/**
 * Fetches aggregate customer statistics.
 *
 * Query key: `customers.stats`. `staleTime` is 60 seconds; there is no polling,
 * so stats refresh on mount/navigation after the cache goes stale.
 *
 * @returns A React Query result containing the customer totals.
 */
export function useCustomerStats() {
  return useQuery({
    queryKey: queryKeys.customers.stats,
    queryFn: ({ signal }) => getCustomerStats({ signal }),
    staleTime: 60_000,
  });
}
