import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listPayouts } from '../services/payouts'
import { queryKeys } from '../lib/queryKeys'

export function usePayouts(params) {
  return useQuery({
    queryKey: queryKeys.payouts.list(params),
    queryFn: () => listPayouts(params),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  })
}
