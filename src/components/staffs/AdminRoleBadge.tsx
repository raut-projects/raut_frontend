"use client";

import { usePermissions } from "@/hooks/usePermissions";
import { useRbacRoles } from "@/hooks/useRbacCatalog";
import {
  findCatalogRole,
  roleDisplayName,
  roleToneFor,
} from "@/lib/rbacRoles";
import { PERMISSIONS } from "@/lib/permissions";
import type { RbacCatalogRole } from "@/types/rbac";

const EMPTY_ROLES: RbacCatalogRole[] = [];

export function AdminRoleBadge({ role }: { role: string }) {
  const { has } = usePermissions();
  const canReadRoles =
    has(PERMISSIONS.PLATFORM_ROLES_READ) ||
    has(PERMISSIONS.PLATFORM_ADMINS_MANAGE);
  const rolesQuery = useRbacRoles(canReadRoles);
  const catalogRole = findCatalogRole(rolesQuery.data ?? EMPTY_ROLES, role);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${roleToneFor(catalogRole ?? role)}`}
    >
      {roleDisplayName(catalogRole ?? role)}
    </span>
  );
}
