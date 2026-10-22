import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listRiders } from '../services/riders.js'
import { queryKeys } from '../lib/queryKeys.js'

export function useRiders(params) {
  return useQuery({
    queryKey: queryKeys.riders.list(params),
    queryFn: () => listRiders(params),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  })
}
