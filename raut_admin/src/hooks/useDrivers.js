import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listDrivers } from '../services/drivers.js'
import { queryKeys } from '../lib/queryKeys.js'

export function useDrivers(params) {
  return useQuery({
    queryKey: queryKeys.drivers.list(params),
    queryFn: () => listDrivers(params),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  })
}
