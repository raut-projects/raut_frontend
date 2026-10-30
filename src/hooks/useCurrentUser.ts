import { useQuery } from '@tanstack/react-query'
import { fetchCurrentUser } from '../services/auth'
import { queryKeys } from '../lib/queryKeys'

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.me.all,
    queryFn: fetchCurrentUser,
    staleTime: 60_000,
  })
}
