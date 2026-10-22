import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listDeliveries } from '../services/deliveries.js'
import { queryKeys } from '../lib/queryKeys.js'

export function useDeliveries(params) {
  return useQuery({
    queryKey: queryKeys.deliveries.list(params),
    queryFn: () => listDeliveries(params),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  })
}
