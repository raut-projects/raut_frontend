/**
 * Admin-user management hooks for the access control screens.
 * Provides paginated directory queries, single-user detail lookups and
 * invite/update/deactivate/reactivate mutations. Collaborates with the
 * adminUsers service, queryKeys and the toast context.
 */
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

/**
 * Lists admin users for the directory table, keyed by the supplied filters.
 *
 * Keeps the previous page visible while new params load and polls every
 * 60 seconds. No additional gating: the screen controls when it is mounted.
 *
 * @param params - Search, role, status and pagination filters.
 * @returns A React Query result containing the admin-user page.
 */
export function useAdminUsers(params: AdminUserListParams) {
  return useQuery({
    queryKey: queryKeys.adminUsers.list(params),
    queryFn: () => listAdminUsers(params),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });
}

/**
 * Loads a single admin user by id.
 *
 * Query key: `adminUsers.detail(userId)`. Disabled until `userId` is truthy,
 * which avoids an empty-id request while a drawer or route param resolves.
 *
 * @param userId - Admin user identifier.
 * @returns A React Query result containing the admin user.
 */
export function useAdminUser(userId: string) {
  return useQuery({
    queryKey: queryKeys.adminUsers.detail(userId),
    queryFn: () => getAdminUser(userId),
    enabled: Boolean(userId),
  });
}

/**
 * Invites a new admin user.
 *
 * On success invalidates `adminUsers.all` and toasts the invited user's name;
 * failures surface the service error through the toast context.
 *
 * @returns A React Query mutation accepting an `AdminUserInvitePayload`.
 */
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

/**
 * Updates an admin user's roles or access settings.
 *
 * Variables: `{ userId, payload }`. Invalidates `adminUsers.all`, refreshing
 * both the directory and any open detail query.
 *
 * @returns A React Query mutation for the update.
 */
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

/**
 * Deactivates an admin user, optionally recording a reason.
 *
 * Variables: `{ userId, reason? }`. Invalidates `adminUsers.all` so the
 * directory and detail views reflect the new status.
 *
 * @returns A React Query mutation for the deactivation.
 */
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

/**
 * Reactivates a deactivated admin user.
 *
 * Variables: `{ userId }`. Invalidates `adminUsers.all` so access lists and
 * detail drawers refresh.
 *
 * @returns A React Query mutation for the reactivation.
 */
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
