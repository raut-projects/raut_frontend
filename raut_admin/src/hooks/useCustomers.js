import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCustomer, listCustomers } from '../services/customers.js'
import { queryKeys } from '../lib/queryKeys.js'
import { insertOptimistic, replaceOptimistic, rollback } from '../lib/optimistic.js'
import { useToast } from '../components/toastContext.js'

export function useCustomers(params) {
  return useQuery({
    queryKey: queryKeys.customers.list(params),
    queryFn: () => listCustomers(params),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: createCustomer,

    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.customers.all })

      const optimistic = {
        id: `optimistic-${Date.now()}`,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        status: payload.status,
        orders: 0,
        joined: 'Just now',
        pending: true,
      }

      const previous = insertOptimistic(queryClient, {
        queryKey: queryKeys.customers.all,
        record: optimistic,
        matches: (record, params) => {
          const query = (params.search ?? '').trim().toLowerCase()
          if (!query) return true
          return (
            record.name.toLowerCase().includes(query) ||
            record.email.toLowerCase().includes(query)
          )
        },
      })

      return { previous, optimistic }
    },

    onSuccess: (created, _payload, context) => {
      replaceOptimistic(queryClient, {
        queryKey: queryKeys.customers.all,
        optimisticId: context.optimistic.id,
        record: created,
      })
      toast.success(`${created.name} was added.`)
    },

    onError: (error, _payload, context) => {
      rollback(queryClient, context.previous)
      toast.error(error.message)
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.customers.all }),
  })
}
