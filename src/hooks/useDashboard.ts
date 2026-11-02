import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getDashboard } from '../services/dashboard'
import { queryKeys } from '../lib/queryKeys'
import type { AnalyticsRange } from '../types/index'

export function useDashboard(range: AnalyticsRange, compare = false) {
  return useQuery({
    queryKey: queryKeys.dashboard.byRange(range, compare),
    queryFn: () => getDashboard(range, compare),
    refetchInterval: 60_000,
    placeholderData: keepPreviousData,
  })
}
