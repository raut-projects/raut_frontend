"use client";

import type { ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";

type CanProps = {
  permission?: string;
  permissions?: string[];
  mode?: "any" | "all";
  fallback?: ReactNode;
  children?: ReactNode;
};

export function Can({
  permission,
  permissions,
  mode = "any",
  fallback = null,
  children,
}: CanProps) {
  const { hydrated, has, hasAny, hasAll } = usePermissions();

  if (!hydrated) return null;

  const allowed = permission
    ? has(permission)
    : permissions?.length
      ? mode === "all"
        ? hasAll(permissions)
        : hasAny(permissions)
      : true;

  return <>{allowed ? children : fallback}</>;
}

export function CanAny({
  permissions,
  fallback = null,
  children,
}: Omit<CanProps, "permission" | "mode">) {
  return (
    <Can permissions={permissions} fallback={fallback}>
      {children}
    </Can>
  );
}
