"use client";

import { useMemo } from "react";
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
} from "../lib/permissions";
import { useSession } from "./useSession";

export function usePermissions() {
  const session = useSession();
  const access = session?.access ?? null;

  return useMemo(
    () => ({
      access,
      roles: access?.roles ?? [],
      permissions: access?.permissions ?? [],
      loaded: Boolean(access),
      has: (permission: string) => hasPermission(access, permission),
      hasAny: (permissions: string[]) => hasAnyPermission(access, permissions),
      hasAll: (permissions: string[]) => hasAllPermissions(access, permissions),
    }),
    [access],
  );
}
