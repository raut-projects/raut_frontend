import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listAllDrivers, listDrivers } from "../services/drivers";
import { queryKeys } from "../lib/queryKeys";

export function useDrivers(params) {
  return useQuery({
    queryKey: queryKeys.drivers.list(params),
    queryFn: () => listDrivers(params),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });
}

export function useAllDrivers() {
  return useQuery({
    queryKey: queryKeys.drivers.list({ scope: "all" }),
    queryFn: listAllDrivers,
    refetchInterval: 30_000,
  });
}
