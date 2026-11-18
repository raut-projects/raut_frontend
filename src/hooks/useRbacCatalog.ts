import { useQuery } from "@tanstack/react-query";

import { RBAC_REVALIDATE_MS } from "@/lib/config";
import { queryKeys } from "@/lib/queryKeys";
import { fetchPermissionCatalog, fetchRbacRoles } from "@/services/rbac";

const queryOptions = {
  staleTime: RBAC_REVALIDATE_MS,
  refetchOnWindowFocus: false,
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
