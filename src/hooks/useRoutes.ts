import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys.js'
import { getRouteSummary, listRoutes } from '../services/routes.js'

export function useRoutes(params) {
  return useQuery({
    queryKey: queryKeys.routes.list(params),
    queryFn: () => listRoutes(params),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  })
}

export function useRouteSummary() {
  return useQuery({
    queryKey: queryKeys.routes.summary,
    queryFn: getRouteSummary,
    refetchInterval: 60_000,
  })
}
