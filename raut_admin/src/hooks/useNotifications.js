import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../components/toastContext.js'
import { queryKeys } from '../lib/queryKeys.js'
import { listNotifications, markNotificationRead } from '../services/notifications.js'

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: listNotifications,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: markNotificationRead,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
    },

    onError: (error) => {
      toast.error(error?.message ?? 'The notification could not be updated.')
    },
  })
}
