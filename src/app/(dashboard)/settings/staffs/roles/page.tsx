"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, Plus } from "lucide-react";

import { Can } from "@/components/Can";
import { RoleEditorDialog } from "@/components/staffs/RoleEditorDialog";
import { QueryError, TableSkeleton } from "@/components/queryStates";
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
import { useRbacRoles } from "@/hooks/useRbacCatalog";
import { PERMISSIONS } from "@/lib/permissions";
import { formatRbacScope } from "@/lib/rbacCatalog";
import type { RbacCatalogRole } from "@/types/rbac";

export default function RolesPage() {
  const { has } = usePermissions();
  const canReadRoles = has(PERMISSIONS.PLATFORM_ROLES_READ);
  const canManageRoles = has(PERMISSIONS.PLATFORM_ROLES_MANAGE);
  const rolesQuery = useRbacRoles(canReadRoles);

  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RbacCatalogRole | null>(null);

  const roles = useMemo(
    () => (rolesQuery.data ?? []).filter((role) => role.id || role.key),
    [rolesQuery.data],
  );

  const filteredRoles = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return roles;

    return roles.filter(
      (role) =>
        role.name.toLowerCase().includes(needle) ||
        role.key.toLowerCase().includes(needle) ||
        role.description.toLowerCase().includes(needle),
    );
  }, [roles, search]);

  const openEditor = (role: RbacCatalogRole | null) => {
    if (!canManageRoles) return;
    setEditingRole(role);
    setEditorOpen(true);
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
            Roles
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Create and update RBAC roles and the permissions they grant.
          </p>
        </div>
        <Can permission={PERMISSIONS.PLATFORM_ROLES_MANAGE}>
          <Button
            type="button"
            size="sm"
            onClick={() => openEditor(null)}
            className="h-9 px-3 text-sm font-semibold"
          >
            <Plus className="size-4" aria-hidden="true" />
            New role
          </Button>
        </Can>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filter roles"
            aria-label="Filter roles"
            disabled={rolesQuery.isPending || rolesQuery.isError}
            className="h-9 w-full bg-white sm:max-w-xs"
          />
          <p className="text-xs text-slate-500 sm:ml-auto">
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {filteredRoles.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">{roles.length}</span>{" "}
            roles
          </p>
        </div>

        {rolesQuery.isPending ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <TableSkeleton rows={8} cols={5} mobileCols={2} lgCols={5} />
            </table>
          </div>
        ) : rolesQuery.isError ? (
          <QueryError error={rolesQuery.error} onRetry={() => void rolesQuery.refetch()} />
        ) : (
          <Table>
            <TableHeader className="bg-slate-50 [&_tr]:border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead>Role</TableHead>
                <TableHead>Key</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="w-24 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.map((role) => {
                const scopeSummary = Array.from(
                  new Set(role.permissions.map((permission) => formatRbacScope(permission.scope))),
                );

                return (
                  <TableRow key={role.id ?? role.key}>
                    <TableCell className="whitespace-normal">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-900">
                          {role.name || role.key}
                        </span>
                        {role.isSystem ? (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-semibold text-slate-600">
                            System
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">
                      {role.key}
                    </TableCell>
                    <TableCell className="hidden max-w-sm whitespace-normal text-sm text-slate-500 md:table-cell">
                      {role.description || "-"}
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <span className="text-sm font-medium text-slate-700">
                        {role.permissions.length}
                      </span>
                      {scopeSummary.length ? (
                        <span className="mt-0.5 block text-xs text-slate-400">
                          {scopeSummary.join(", ")}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">
                      <Can permission={PERMISSIONS.PLATFORM_ROLES_MANAGE}>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEditor(role)}
                          className="h-auto border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="size-3.5" aria-hidden="true" />
                          Edit
                        </Button>
                      </Can>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredRoles.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={5}
                    className="px-4 py-12 text-center whitespace-normal"
                  >
                    <p className="text-sm font-medium text-slate-700">
                      No roles found.
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Create a role to grant permissions to staff.
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <RoleEditorDialog
        key={`role-editor-${editorOpen}-${editingRole?.key ?? "new"}`}
        open={editorOpen}
        role={editingRole}
        onClose={() => {
          setEditorOpen(false);
          setEditingRole(null);
        }}
      />
    </div>
  );
}