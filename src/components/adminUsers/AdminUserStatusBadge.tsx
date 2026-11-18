"use client";

import { usePermissions } from "@/hooks/usePermissions";
import { useRbacRoles } from "@/hooks/useRbacCatalog";
import {
  ADMIN_STATUS_LABELS,
  ADMIN_STATUS_TONES,
  normalizeAdminStatus,
  type AdminUserStatus,
} from "@/lib/adminUsers";
import {
  findCatalogRole,
  roleDisplayName,
  roleToneFor,
} from "@/lib/rbacRoles";
import { PERMISSIONS } from "@/lib/permissions";
import type { RbacCatalogRole } from "@/types/rbac";

const EMPTY_ROLES: RbacCatalogRole[] = [];

export function AdminUserStatusBadge({ status }: { status: AdminUserStatus }) {
  const normalized = normalizeAdminStatus(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${ADMIN_STATUS_TONES[normalized]}`}
    >
      <span
        className={`size-1.5 rounded-full ${
          normalized === "active"
            ? "bg-emerald-500"
            : normalized === "invited"
              ? "bg-amber-500"
              : "bg-slate-400"
        }`}
        aria-hidden="true"
      />
      {ADMIN_STATUS_LABELS[normalized]}
    </span>
  );
}

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
