import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listCustomers } from '../services/customers.js'
import { queryKeys } from '../lib/queryKeys.js'

export function useCustomers(params) {
  return useQuery({
    queryKey: queryKeys.customers.list(params),
    queryFn: () => listCustomers(params),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  })
}
