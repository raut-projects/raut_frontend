"use client";

import { useMemo } from "react";
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
} from "../lib/permissions";
import { usePermissionStore } from "@/store/permissionStore";

export function usePermissions() {
  const access = usePermissionStore((state) => state.access);
  const hydrated = usePermissionStore((state) => state.hydrated);

  return useMemo(
    () => ({
      access,
      hydrated,
      roles: access?.roles ?? [],
      permissions: access?.permissions ?? [],
      loaded: hydrated && Boolean(access),
      has: (permission: string) => hasPermission(access, permission),
      hasAny: (permissions: string[]) => hasAnyPermission(access, permissions),
      hasAll: (permissions: string[]) => hasAllPermissions(access, permissions),
    }),
    [access, hydrated],
  );
}
