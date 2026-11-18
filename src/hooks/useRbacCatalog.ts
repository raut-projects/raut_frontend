import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { RBAC_REVALIDATE_MS } from "@/lib/config";
import { queryKeys } from "@/lib/queryKeys";
import {
  createRbacRole,
  deleteRbacRole,
  fetchMyPermissions,
  fetchPermissionCatalog,
  fetchRbacRoles,
  updateRbacRole,
} from "@/services/rbac";
import { updateSession } from "@/services/tokenStore";
import type { RbacRolePayload } from "@/types/rbac";

const queryOptions = {
  staleTime: RBAC_REVALIDATE_MS,
  refetchOnWindowFocus: false,
};

const refreshSessionAccess = async (queryClient: ReturnType<typeof useQueryClient>) => {
  try {
    const access = await fetchMyPermissions();
    updateSession({ access });
    queryClient.invalidateQueries({ queryKey: queryKeys.me.all });
  } catch {
    return;
  }
};

const invalidateRbac = async (queryClient: ReturnType<typeof useQueryClient>) => {
  await queryClient.invalidateQueries({ queryKey: queryKeys.rbac.all });
  await queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers.all });
  await refreshSessionAccess(queryClient);
};

export function usePermissionCatalog(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.rbac.permissions,
    queryFn: fetchPermissionCatalog,
    enabled,
    ...queryOptions,
  });
}

export function useRbacRoles(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.rbac.roles,
    queryFn: fetchRbacRoles,
    enabled,
    ...queryOptions,
  });
}

export function useCreateRbacRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRbacRole,
    onSuccess: async () => {
      await invalidateRbac(queryClient);
    },
  });
}

export function useUpdateRbacRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      roleKey,
      payload,
    }: {
      roleKey: string;
      payload: RbacRolePayload;
    }) => updateRbacRole(roleKey, payload),
    onSuccess: async () => {
      await invalidateRbac(queryClient);
    },
  });
}

export function useDeleteRbacRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRbacRole,
    onSuccess: async () => {
      await invalidateRbac(queryClient);
    },
  });
}
