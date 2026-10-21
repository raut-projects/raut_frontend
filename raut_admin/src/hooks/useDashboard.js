import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '../services/dashboard.js'
import { queryKeys } from '../lib/queryKeys.js'

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard.all,
    queryFn: getDashboard,
    refetchInterval: 30_000,
  })
}
