import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getTransactionSummary, listTransactions } from '../services/transactions'
import { queryKeys } from '../lib/queryKeys'

export function useTransactions(params) {
  return useQuery({
    queryKey: queryKeys.transactions.list(params),
    queryFn: () => listTransactions(params),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  })
}

export function useTransactionSummary() {
  return useQuery({
    queryKey: queryKeys.transactions.summary,
    queryFn: getTransactionSummary,
    refetchInterval: 60_000,
  })
}

