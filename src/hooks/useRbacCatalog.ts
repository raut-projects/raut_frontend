import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";
import {
  createRbacRegion,
  createRbacRole,
  deleteRbacRole,
  fetchMyPermissions,
  fetchPermissionCatalog,
  fetchRbacRegions,
  fetchRbacRoles,
  updateRbacRole,
} from "@/services/rbac";
import { usePermissionStore } from "@/store/permissionStore";
import type {
  RbacRegionPayload,
  RbacRoleCreatePayload,
  RbacRoleUpdatePayload,
} from "@/types/rbac";

const RBAC_CATALOG_STALE_MS = 5 * 60 * 1000;

const queryOptions = {
  staleTime: RBAC_CATALOG_STALE_MS,
  refetchOnWindowFocus: false,
};

const refreshCachedPermissions = async (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  try {
    const access = await fetchMyPermissions();
    usePermissionStore.getState().setAccess(access);
    queryClient.invalidateQueries({ queryKey: queryKeys.me.all });
    return true;
  } catch (error) {
    console.error("Failed to refresh cached permissions", error);
    return false;
  }
};

const invalidateRbac = async (queryClient: ReturnType<typeof useQueryClient>) => {
  await queryClient.invalidateQueries({ queryKey: queryKeys.rbac.all });
  await queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
  await refreshCachedPermissions(queryClient);
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

export function useRbacRegions(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.rbac.regions,
    queryFn: fetchRbacRegions,
    enabled,
    ...queryOptions,
  });
}

export function useCreateRbacRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RbacRoleCreatePayload) => createRbacRole(payload),
    onSuccess: async () => {
      await invalidateRbac(queryClient);
    },
  });
}

export function useUpdateRbacRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      roleId,
      roleKey,
      payload,
    }: {
      roleId: string;
      roleKey?: string;
      payload: RbacRoleUpdatePayload;
    }) => updateRbacRole(roleId, payload, roleKey),
    onSuccess: async () => {
      await invalidateRbac(queryClient);
    },
  });
}

export function useDeleteRbacRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: string) => deleteRbacRole(roleId),
    onSuccess: async () => {
      await invalidateRbac(queryClient);
    },
  });
}

export function useCreateRbacRegion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RbacRegionPayload) => createRbacRegion(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.rbac.regions });
    },
  });
}
