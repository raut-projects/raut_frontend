"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Printer, Search, X } from "lucide-react";

import { QueryError, TableSkeleton } from "@/components/queryStates";
import { useToast } from "@/components/toastContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePermissions } from "@/hooks/usePermissions";
import {
  usePermissionCatalog,
  useRbacRoles,
} from "@/hooks/useRbacCatalog";
import { PERMISSIONS } from "@/lib/permissions";
import {
  buildRbacGrantLookup,
  downloadRbacMatrixCsv,
  formatRbacScope,
  mergeRbacPermissionCatalog,
} from "@/lib/rbacCatalog";
import type {
  RbacCatalogPermission,
  RbacCatalogRole,
} from "@/types/rbac";

import { PermissionMatrixTable } from "./PermissionMatrixTable";

type PermissionMatrixDialogProps = {
  open: boolean;
  onClose: () => void;
  initialRole?: string | "all";
};

const EMPTY_PERMISSIONS: RbacCatalogPermission[] = [];
const EMPTY_ROLES: RbacCatalogRole[] = [];

const legend = [
  {
    label: "Granted",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  {
    label: "Scoped",
    className: "border-sky-200 bg-sky-50 text-sky-700",
  },
  {
    label: "Not granted",
    className: "border-slate-200 bg-slate-50 text-slate-400",
  },
];

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function PermissionMatrixDialog({
  open,
  onClose,
  initialRole = "all",
}: PermissionMatrixDialogProps) {
  const toast = useToast();
  const { has } = usePermissions();
  const canReadRoles = has(PERMISSIONS.PLATFORM_ROLES_READ);
  const [roleFilter, setRoleFilter] = useState<string | "all">(initialRole);
  const [search, setSearch] = useState("");

  const permissionsQuery = usePermissionCatalog(open && canReadRoles);
  const rolesQuery = useRbacRoles(open && canReadRoles);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  const roles = rolesQuery.data ?? EMPTY_ROLES;
  const permissions = permissionsQuery.data ?? EMPTY_PERMISSIONS;
  const isLoading = permissionsQuery.isPending || rolesQuery.isPending;
  const isError = permissionsQuery.isError || rolesQuery.isError;

  const allPermissions = useMemo(
    () => mergeRbacPermissionCatalog(permissions, roles),
    [permissions, roles],
  );
  const grantsByRole = useMemo(() => buildRbacGrantLookup(roles), [roles]);

  const filteredPermissions = useMemo(() => {
    const needle = search.trim().toLowerCase();

    if (!needle) return allPermissions;

    return allPermissions.filter(
      (permission) =>
        permission.name.toLowerCase().includes(needle) ||
        permission.code.toLowerCase().includes(needle) ||
        permission.description.toLowerCase().includes(needle) ||
        permission.module.toLowerCase().includes(needle),
    );
  }, [allPermissions, search]);

  const selectedRoles =
    roleFilter === "all"
      ? roles
      : roles.filter((role) => role.key === roleFilter);
  const visibleRoles = selectedRoles.length ? selectedRoles : roles;
  const effectiveRoleFilter = selectedRoles.length ? roleFilter : "all";

  const retry = () => {
    void permissionsQuery.refetch();
    void rolesQuery.refetch();
  };

  const printMatrix = () => {
    const printWindow = window.open("", "_blank", "width=1100,height=800");

    if (!printWindow) {
      toast.error("Allow pop-ups to print the permission matrix.");
      return;
    }

    const header = visibleRoles
      .map(
        (role) =>
          `<th>${escapeHtml(role.name || role.key)}<span>${escapeHtml(role.key)}</span></th>`,
      )
      .join("");
    const rows = filteredPermissions
      .map((permission) => {
        const cells = visibleRoles
          .map((role) => {
            const grant = grantsByRole.get(role.key)?.get(permission.code);
            const scope = grant ? formatRbacScope(grant.scope) : "";
            const label = grant ? `Granted · ${scope}` : "Not granted";
            const cellClass = !grant
              ? "none"
              : grant.scope === "platform"
                ? "granted"
                : "scoped";

            return `<td class="${cellClass}">${escapeHtml(label)}</td>`;
          })
          .join("");

        return `<tr><th class="feature">${escapeHtml(permission.name || permission.code)}<span>${escapeHtml(permission.code)} · ${escapeHtml(formatRbacScope(permission.module))}</span></th>${cells}</tr>`;
      })
      .join("");

    printWindow.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Raut role permissions</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #0f172a; margin: 28px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  p { font-size: 12px; color: #64748b; margin: 0 0 18px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #e2e8f0; padding: 6px 8px; font-size: 10px; text-align: center; }
  thead th { background: #f8fafc; font-size: 9px; text-transform: uppercase; letter-spacing: .03em; }
  thead th span { display: block; font-weight: 400; color: #94a3b8; font-size: 8px; }
  th.feature { text-align: left; font-size: 11px; }
  th.feature span { display: block; font-weight: 400; color: #94a3b8; font-size: 9px; }
  .granted { background: #ecfdf5; color: #047857; }
  .scoped { background: #f0f9ff; color: #0369a1; }
  .none { background: #f8fafc; color: #94a3b8; }
</style>
</head>
<body>
  <h1>Admin role permissions</h1>
  <p>Generated ${escapeHtml(new Date().toLocaleString())} \u00b7 ${filteredPermissions.length} permissions \u00b7 ${visibleRoles.length} roles</p>
  <table>
    <thead><tr><th class="feature">Permission</th>${header}</tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const exportMatrix = () => {
    downloadRbacMatrixCsv(allPermissions, roles);
    toast.success("Role permissions exported.");
  };

  if (!open || typeof document === "undefined" || !canReadRoles) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="permission-matrix-title"
        className="relative flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-elevated"
      >
        <div className="flex shrink-0 items-start gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2
              id="permission-matrix-title"
              className="text-base font-semibold text-slate-900"
            >
              Role permission matrix
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Granted permissions and scopes configured for each admin role.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close permission matrix"
            className="ml-auto shrink-0 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-b border-slate-200 px-5 py-3 sm:flex-row sm:items-center sm:px-6">
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filter permissions"
              aria-label="Filter permission catalog"
              disabled={isLoading || isError}
              className="h-9 bg-white pl-9"
            />
          </div>

          <select
            value={effectiveRoleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            aria-label="Filter matrix by role"
            disabled={isLoading || isError}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:text-slate-400"
          >
            <option value="all">All roles</option>
            {roles.map((role) => (
              <option key={role.key} value={role.key}>
                {role.name || role.key}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap items-center gap-3 sm:ml-auto">
            {legend.map((item) => (
              <span key={item.label} className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={`inline-flex h-4 w-4 items-center justify-center rounded border text-[0.6rem] ${item.className}`}
                >
                  {item.label === "Not granted" ? "\u2014" : "\u2713"}
                </span>
                <span className="text-xs text-slate-500">{item.label}</span>
              </span>
            ))}
            <div className="flex gap-2 sm:ml-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={printMatrix}
                disabled={isLoading || isError}
                className="h-auto border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Printer className="size-3.5" aria-hidden="true" />
                Print
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={exportMatrix}
                disabled={isLoading || isError}
                className="h-auto border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Download className="size-3.5" aria-hidden="true" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {isLoading ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <TableSkeleton
                  rows={10}
                  cols={Math.max(3, visibleRoles.length + 1)}
                  mobileCols={2}
                  lgCols={Math.max(3, visibleRoles.length + 1)}
                />
              </table>
            </div>
          ) : isError ? (
            <QueryError error={permissionsQuery.error ?? rolesQuery.error} onRetry={retry} />
          ) : (
            <>
              <PermissionMatrixTable
                permissions={filteredPermissions}
                roles={visibleRoles}
                grantsByRole={grantsByRole}
                roleFilter={effectiveRoleFilter}
              />
              {filteredPermissions.length === 0 && (
                <p className="px-6 py-12 text-center text-sm text-slate-500">
                  No permissions match that filter.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
