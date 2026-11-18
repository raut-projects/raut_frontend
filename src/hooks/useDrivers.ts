/**
 * Driver directory queries for onboarding and fleet screens.
 * Exposes a filtered, paginated driver list plus an unpaginated roster used by
 * lookups such as ride assignment. Collaborates with the drivers service and
 * queryKeys.drivers.
 */
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listAllDrivers, listDrivers } from "../services/drivers";
import { queryKeys } from "../lib/queryKeys";

/**
 * Lists drivers for the supplied filters.
 *
 * Query key: `drivers.list(params)`. Retains the previous page while filters
 * change and polls every 30 seconds so online/approval status stays fresh.
 *
 * @param params - Search, status and pagination filters.
 * @returns A React Query result containing the driver page.
 */
export function useDrivers(params) {
  return useQuery({
    queryKey: queryKeys.drivers.list(params),
    queryFn: () => listDrivers(params),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });
}

/**
 * Fetches the complete driver roster.
 *
 * Query key: `drivers.list({ scope: "all" })`, which stays separate from
 * filtered pages. Polls every 30 seconds; no placeholder needed because the
 * roster is not paginated.
 *
 * @returns A React Query result containing all drivers.
 */
export function useAllDrivers() {
  return useQuery({
    queryKey: queryKeys.drivers.list({ scope: "all" }),
    queryFn: listAllDrivers,
    refetchInterval: 30_000,
  });
}
