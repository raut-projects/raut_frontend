import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getDashboard } from '../services/dashboard'
import { queryKeys } from '../lib/queryKeys'
import type { AnalyticsPeriod } from '../types/index'

export function useDashboard(period: AnalyticsPeriod = 'month') {
  return useQuery({
    queryKey: queryKeys.dashboard.byPeriod(period),
    queryFn: () => getDashboard(period),
    refetchInterval: 60_000,
    placeholderData: keepPreviousData,
  })
}
