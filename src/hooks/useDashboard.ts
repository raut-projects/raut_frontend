import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getDashboard } from '../services/dashboard.js'
import { queryKeys } from '../lib/queryKeys.js'
import type { AnalyticsPeriod } from '../types/index.js'

export function useDashboard(period: AnalyticsPeriod = 'month') {
  return useQuery({
    queryKey: queryKeys.dashboard.byPeriod(period),
    queryFn: () => getDashboard(period),
    refetchInterval: 60_000,
    placeholderData: keepPreviousData,
  })
}
