import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getCustomerStats, listCustomers } from "../services/customers";
import { queryKeys } from "../lib/queryKeys";

export function useCustomers(params) {
  return useQuery({
    queryKey: queryKeys.customers.list(params),
    queryFn: () => listCustomers(params),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });
}

export function useCustomerStats() {
  return useQuery({
    queryKey: queryKeys.customers.stats,
    queryFn: getCustomerStats,
    staleTime: 60_000,
  });
}
