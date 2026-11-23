"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Printer, Search } from "lucide-react";

import { QueryError, TableSkeleton } from "@/components/queryStates";
import { useToast } from "@/components/toastContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePermissions } from "@/hooks/usePermissions";
import { usePermissionCatalog, useRbacRoles } from "@/hooks/useRbacCatalog";
import { PERMISSIONS } from "@/lib/permissions";
import {
  buildRbacGrantLookup,
  downloadRbacMatrixCsv,
  formatRbacScope,
  mergeRbacPermissionCatalog,
} from "@/lib/rbacCatalog";
import type { RbacCatalogPermission, RbacCatalogRole } from "@/types/rbac";

const EMPTY_PERMISSIONS: RbacCatalogPermission[] = [];
const EMPTY_ROLES: RbacCatalogRole[] = [];

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export default function PermissionsPage() {
  const toast = useToast();
  const { has } = usePermissions();
  const canReadRoles = has(PERMISSIONS.PLATFORM_ROLES_READ);
  const [search, setSearch] = useState("");

  const permissionsQuery = usePermissionCatalog(canReadRoles);
  const rolesQuery = useRbacRoles(canReadRoles);

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

  const retry = () => {
    void permissionsQuery.refetch();
    void rolesQuery.refetch();
  };

  const exportMatrix = () => {
    downloadRbacMatrixCsv(allPermissions, roles);
    toast.success("Permissions exported.");
  };

  const printMatrix = () => {
    const printWindow = window.open("", "_blank", "width=1100,height=800");
    if (!printWindow) {
      toast.error("Allow pop-ups to print permissions.");
      return;
    }

    const rows = filteredPermissions
      .map((permission) => {
        const grantedRoles = roles
          .filter((role) => grantsByRole.get(role.key)?.get(permission.code))
          .map((role) => {
            const grant = grantsByRole.get(role.key)?.get(permission.code);
            const scope = grant ? formatRbacScope(grant.scope) : "";
            return `${role.name || role.key} (${scope})`;
          });

        return `<tr>
          <td>${escapeHtml(permission.name || permission.code)}</td>
          <td><code>${escapeHtml(permission.code)}</code></td>
          <td>${escapeHtml(formatRbacScope(permission.module))}</td>
          <td>${escapeHtml(permission.description || "-")}</td>
          <td>${escapeHtml(grantedRoles.join(", ") || "Not granted")}</td>
        </tr>`;
      })
      .join("");

    printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8" />
<title>Raut permissions</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#0f172a;margin:28px}h1{font-size:20px;margin:0 0 4px}p{font-size:12px;color:#64748b;margin:0 0 18px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #e2e8f0;padding:7px 8px;font-size:11px;text-align:left;vertical-align:top}th{background:#f8fafc;font-size:10px;text-transform:uppercase;letter-spacing:.03em}code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px}</style>
</head><body>
<h1>Permissions</h1>
<p>Generated ${escapeHtml(new Date().toLocaleString())} · ${filteredPermissions.length} permissions</p>
<table><thead><tr><th>Permission</th><th>Code</th><th>Module</th><th>Description</th><th>Granted roles</th></tr></thead><tbody>${rows}</tbody></table>
</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/settings/staffs"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Staff & Roles
          </Link>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Permissions
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Permission catalog and the roles/scopes that grant each code.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={printMatrix}
            disabled={isLoading || isError}
            className="h-9 border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Printer className="size-4" aria-hidden="true" />
            Print
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={exportMatrix}
            disabled={isLoading || isError}
            className="h-9 border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="size-4" aria-hidden="true" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
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
              aria-label="Filter permissions"
              disabled={isLoading || isError}
              className="h-9 bg-white pl-9"
            />
          </div>
          <p className="text-xs text-slate-500 sm:ml-auto">
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {filteredPermissions.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">
              {allPermissions.length}
            </span>{" "}
            permissions
          </p>
        </div>

        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <TableSkeleton rows={10} cols={5} mobileCols={2} lgCols={5} />
            </table>
          </div>
        ) : isError ? (
          <QueryError
            error={permissionsQuery.error ?? rolesQuery.error}
            onRetry={retry}
          />
        ) : (
          <Table>
            <TableHeader className="bg-slate-50 [&_tr]:border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead>Permission</TableHead>
                <TableHead>Code</TableHead>
                <TableHead className="hidden md:table-cell">Module</TableHead>
                <TableHead className="hidden lg:table-cell">Description</TableHead>
                <TableHead>Granted roles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPermissions.map((permission) => {
                const grantedRoles = roles.flatMap((role) => {
                  const grant = grantsByRole.get(role.key)?.get(permission.code);
                  if (!grant) return [];
                  return [
                    {
                      key: role.key,
                      name: role.name || role.key,
                      scope: formatRbacScope(grant.scope),
                    },
                  ];
                });

                return (
                  <TableRow key={permission.code}>
                    <TableCell className="font-medium whitespace-normal text-slate-900">
                      {permission.name || permission.code}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">
                      {permission.code}
                    </TableCell>
                    <TableCell className="hidden text-slate-600 md:table-cell">
                      {formatRbacScope(permission.module)}
                    </TableCell>
                    <TableCell className="hidden max-w-sm whitespace-normal text-sm text-slate-500 lg:table-cell">
                      {permission.description || "-"}
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      {grantedRoles.length ? (
                        <div className="flex flex-wrap gap-1.5">
                          {grantedRoles.map((role) => (
                            <span
                              key={role.key}
                              className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[0.7rem] font-medium text-slate-700"
                              title={`${role.name} · ${role.scope}`}
                            >
                              {role.name}
                              <span className="ml-1 text-slate-400">
                                {role.scope}
                              </span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Not granted</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredPermissions.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={5}
                    className="px-4 py-12 text-center whitespace-normal text-sm text-slate-500"
                  >
                    No permissions match that filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}