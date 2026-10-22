import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../components/toastContext.js'
import { queryKeys } from '../lib/queryKeys.js'
import {
  cancelRide,
  deactivateUser,
  reactivateUser,
  rejectDriver,
  setUserRole,
  suspendDriver,
  unsuspendDriver,
  verifyDriver,
} from '../services/adminActions.js'

const useAction = ({ mutationFn, successMessage }) => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn,

    onSuccess: (_data, variables) => {
      toast.success(typeof successMessage === 'function' ? successMessage(variables) : successMessage)

      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.riders.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.deliveries.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
    },

    onError: (error) => {
      toast.error(error?.message ?? 'The action could not be completed.')
    },
  })
}

export const useVerifyDriver = () =>
  useAction({
    mutationFn: ({ driverId }) => verifyDriver(driverId),
    successMessage: 'Driver verified.',
  })

export const useRejectDriver = () =>
  useAction({
    mutationFn: ({ driverId, reason }) => rejectDriver(driverId, reason),
    successMessage: 'Driver application rejected.',
  })

export const useSuspendDriver = () =>
  useAction({
    mutationFn: ({ driverId, reason }) => suspendDriver(driverId, reason),
    successMessage: 'Driver suspended.',
  })

export const useUnsuspendDriver = () =>
  useAction({
    mutationFn: ({ driverId }) => unsuspendDriver(driverId),
    successMessage: 'Driver reinstated.',
  })

export const useSetUserRole = () =>
  useAction({
    mutationFn: ({ userId, role }) => setUserRole(userId, role),
    successMessage: ({ role }) => `Role changed to ${role.replace('_', ' ')}.`,
  })

export const useDeactivateUser = () =>
  useAction({
    mutationFn: ({ userId, reason }) => deactivateUser(userId, reason),
    successMessage: 'Account deactivated.',
  })

export const useReactivateUser = () =>
  useAction({
    mutationFn: ({ userId }) => reactivateUser(userId),
    successMessage: 'Account reactivated.',
  })

export const useCancelRide = () =>
  useAction({
    mutationFn: ({ rideId, reason, refund }) => cancelRide(rideId, reason, refund),
    successMessage: 'Ride cancelled.',
  })
