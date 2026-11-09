import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useToast } from "@/components/toastContext";
import type {
  AdminUserInvitePayload,
  AdminUserListParams,
  AdminUserUpdatePayload,
} from "@/lib/adminUsers";
import { queryKeys } from "@/lib/queryKeys";
import {
  deactivateAdminUser,
  getAdminUser,
  inviteAdminUser,
  listAdminUsers,
  reactivateAdminUser,
  updateAdminUser,
} from "@/services/adminUsers";

export function useAdminUsers(params: AdminUserListParams) {
  return useQuery({
    queryKey: queryKeys.adminUsers.list(params),
    queryFn: () => listAdminUsers(params),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });
}

export function useAdminUser(userId: string) {
  return useQuery({
    queryKey: queryKeys.adminUsers.detail(userId),
    queryFn: () => getAdminUser(userId),
    enabled: Boolean(userId),
  });
}

export function useInviteAdminUser() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (payload: AdminUserInvitePayload) => inviteAdminUser(payload),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers.all });
      toast.success(`Invitation sent to ${user.name}.`);
    },
    onError: (error: Error) => {
      toast.error(error?.message ?? "The invitation could not be sent.");
    },
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string;
      payload: AdminUserUpdatePayload;
    }) => updateAdminUser(userId, payload),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers.all });
      toast.success(`${user.name}'s access was updated.`);
    },
    onError: (error: Error) => {
      toast.error(error?.message ?? "The admin user could not be updated.");
    },
  });
}

export function useDeactivateAdminUser() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      deactivateAdminUser(userId, reason),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers.all });
      toast.success(`${user.name}'s account was deactivated.`);
    },
    onError: (error: Error) => {
      toast.error(error?.message ?? "The account could not be deactivated.");
    },
  });
}

export function useReactivateAdminUser() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      reactivateAdminUser(userId),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers.all });
      toast.success(`${user.name}'s account was reactivated.`);
    },
    onError: (error: Error) => {
      toast.error(error?.message ?? "The account could not be reactivated.");
    },
  });
}
