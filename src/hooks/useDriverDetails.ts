/**
 * Driver profile query for the driver detail screen.
 * Loads the full driver record on top of the lighter list query. Collaborates
 * with the driverDetails service and queryKeys.drivers.
 */
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { getDriverDetails } from "../services/driverDetails";

/**
 * Fetches a driver's full detail record.
 *
 * Query key: `drivers.detail(driverId)`. Disabled until an id is available and
 * polls every 30 seconds so status, documents and earnings stay current while
 * a detail drawer is open.
 *
 * @param driverId - Driver identifier.
 * @returns A React Query result containing the driver details.
 */
export function useDriverDetails(driverId) {
  return useQuery({
    queryKey: queryKeys.drivers.detail(driverId),
    queryFn: () => getDriverDetails(driverId),
    enabled: Boolean(driverId),
    refetchInterval: 30_000,
  });
}
