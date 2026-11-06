import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { getDriverDetails } from "../services/driverDetails";

export function useDriverDetails(driverId) {
  return useQuery({
    queryKey: queryKeys.drivers.detail(driverId),
    queryFn: () => getDriverDetails(driverId),
    enabled: Boolean(driverId),
  });
}
