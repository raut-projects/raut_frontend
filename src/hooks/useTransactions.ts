/**
 * Transaction list and summary hooks with 30s/60s polling.
 * Collaborates with transactions service and queryKeys.
 */
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getTransactionSummary,
  listTransactions,
} from "../services/transactions";
import { queryKeys } from "../lib/queryKeys";

/**
 * useTransactions hook.
 */
export function useTransactions(params) {
  return useQuery({
    queryKey: queryKeys.transactions.list(params),
    queryFn: () => listTransactions(params),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });
}

/**
 * useTransactionSummary hook.
 */
export function useTransactionSummary() {
  return useQuery({
    queryKey: queryKeys.transactions.summary,
    queryFn: getTransactionSummary,
    refetchInterval: 60_000,
  });
}
