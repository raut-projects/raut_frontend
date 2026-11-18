"use client";

import { useMemo } from "react";

import { usePermissions } from "@/hooks/usePermissions";
import { useRbacRoles } from "@/hooks/useRbacCatalog";
import { ADMIN_ROLES, normalizeAdminRole } from "@/lib/adminUsers";
import {
  roleCatalogDescription,
  roleDisplayName,
} from "@/lib/rbacRoles";
import { PERMISSIONS } from "@/lib/permissions";
import type { RbacCatalogRole } from "@/types/rbac";

type AdminRoleSelectProps = {
  value: string;
  onChange: (role: string) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

const EMPTY_ROLES: RbacCatalogRole[] = [];

export function AdminRoleSelect({
  value,
  onChange,
  disabled,
  id,
  className = inputClass,
}: AdminRoleSelectProps) {
  const { has } = usePermissions();
  const canReadRoles =
    has(PERMISSIONS.PLATFORM_ROLES_READ) ||
    has(PERMISSIONS.PLATFORM_ADMINS_MANAGE);
  const rolesQuery = useRbacRoles(canReadRoles);
  const catalogRoles = rolesQuery.data ?? EMPTY_ROLES;

  const options = useMemo(() => {
    const mapped = catalogRoles.map((role) => ({
      key: role.key,
      label: roleDisplayName(role),
      description: roleCatalogDescription(role),
    }));
    const currentKey = normalizeAdminRole(value);

    if (
      currentKey &&
      !mapped.some((role) => normalizeAdminRole(role.key) === currentKey)
    ) {
      mapped.unshift({
        key: value,
        label: roleDisplayName(value),
        description: roleCatalogDescription(value),
      });
    }

    if (mapped.length) return mapped;

    return ADMIN_ROLES.map((role) => ({
      key: role.key,
      label: role.label,
      description: role.description,
    }));
  }, [catalogRoles, value]);

  const selected = options.find(
    (role) => normalizeAdminRole(role.key) === normalizeAdminRole(value),
  );

  return (
    <div className="space-y-1.5">
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled || !has(PERMISSIONS.PLATFORM_ROLES_MANAGE)}
        className={className}
      >
        {options.map((role) => (
          <option key={role.key} value={role.key}>
            {role.label}
          </option>
        ))}
      </select>
      {selected?.description ? (
        <p className="text-xs text-slate-500">{selected.description}</p>
      ) : null}
      {rolesQuery.isError ? (
        <p className="text-xs text-amber-700">
          Role catalog could not be loaded; showing known roles only.
        </p>
      ) : null}
    </div>
  );
}
