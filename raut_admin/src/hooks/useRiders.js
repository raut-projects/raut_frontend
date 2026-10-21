import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createRider, listRiders } from '../services/riders.js'
import { queryKeys } from '../lib/queryKeys.js'
import { insertOptimistic, replaceOptimistic, rollback } from '../lib/optimistic.js'
import { useToast } from '../components/toastContext.js'

export function useRiders(params) {
  return useQuery({
    queryKey: queryKeys.riders.list(params),
    queryFn: () => listRiders(params),
    placeholderData: keepPreviousData,
    refetchInterval: 15_000,
  })
}

export function useCreateRider() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: createRider,

    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.riders.all })

      const optimistic = {
        id: `optimistic-${Date.now()}`,
        name: payload.name,
        phone: payload.phone,
        zone: payload.zone,
        status: payload.status,
        deliveries: 0,
        rating: 5.0,
        pending: true,
      }

      const previous = insertOptimistic(queryClient, {
        queryKey: queryKeys.riders.all,
        record: optimistic,
        matches: (record, params) => {
          const query = (params.search ?? '').trim().toLowerCase()
          if (!query) return true
          return (
            record.name.toLowerCase().includes(query) ||
            record.zone.toLowerCase().includes(query)
          )
        },
      })

      return { previous, optimistic }
    },

    onSuccess: (created, _payload, context) => {
      replaceOptimistic(queryClient, {
        queryKey: queryKeys.riders.all,
        optimisticId: context.optimistic.id,
        record: created,
      })
      toast.success(`${created.name} was added to the fleet.`)
    },

    onError: (error, _payload, context) => {
      rollback(queryClient, context.previous)
      toast.error(error.message)
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.riders.all }),
  })
}
