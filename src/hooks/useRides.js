import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getRideSummary, listRides } from '../services/rides.js'
import { queryKeys } from '../lib/queryKeys.js'

export function useRides(params) {
  return useQuery({
    queryKey: queryKeys.rides.list(params),
    queryFn: () => listRides(params),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  })
}

export function useRideSummary() {
  return useQuery({
    queryKey: queryKeys.rides.summary,
    queryFn: getRideSummary,
    refetchInterval: 60_000,
  })
}
