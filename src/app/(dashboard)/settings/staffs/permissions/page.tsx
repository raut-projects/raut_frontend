"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  Download,
  FilterX,
  KeyRound,
  Layers3,
  Printer,
  Search,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";

import { QueryError, TableSkeleton } from "@/components/queryStates";
import { useToast } from "@/components/toastContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
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

type PermissionGrantView = {
  roleKey: string;
  roleName: string;
  scope: string;
  scopeLabel: string;
  constraints: Record<string, unknown>;
};

type PermissionView = RbacCatalogPermission & {
  grantedRoles: PermissionGrantView[];
  actionLabel: string;
};

type ModuleGroup = {
  module: string;
  label: string;
  permissions: PermissionView[];
  grantedCount: number;
};

const ACTION_LABELS: Record<string, string> = {
  read: "Read",
  export: "Export",
  manage: "Manage",
  create: "Create",
  update: "Update",
  delete: "Delete",
  verify: "Verify",
  write: "Write",
};

const formatActionLabel = (code: string) => {
  const segment = code.split(".").filter(Boolean).pop() ?? code;
  const normalized = segment.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  if (ACTION_LABELS[normalized]) return ACTION_LABELS[normalized];
  return normalized
    .split("_")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
};

const EMPTY_PERMISSIONS: RbacCatalogPermission[] = [];
const EMPTY_ROLES: RbacCatalogRole[] = [];
const SCOPE_LEGEND = [
  {
    scope: "platform",
    label: "Platform",
    description: "Access across the whole platform.",
  },
  {
    scope: "region",
    label: "Region",
    description: "Limited to a specific region.",
  },
  {
    scope: "assigned",
    label: "Assigned",
    description: "Limited to records assigned to the user.",
  },
  {
    scope: "own",
    label: "Own",
    description: "Limited to the user's own records.",
  },
] as const;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const formatConstraints = (constraints: Record<string, unknown>) => {
  const entries = Object.entries(constraints ?? {});
  if (entries.length === 0) return "";
  return entries
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(", ");
};

const grantTitle = (grant: PermissionGrantView) => {
  const constraints = formatConstraints(grant.constraints);
  return constraints
    ? `${grant.roleName} · ${grant.scopeLabel} scope · ${constraints}`
    : `${grant.roleName} · ${grant.scopeLabel} scope`;
};

function SummaryCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof KeyRound;
  label: string;
  value: number;
  note: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            { label }
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            { value }
          </p>
          <p className="mt-1 text-xs text-slate-500">{ note }</p>
        </div>
        <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

export default function PermissionsPage() {
  const toast = useToast();
  const { has } = usePermissions();
  const canReadRoles = has(PERMISSIONS.PLATFORM_ROLES_READ);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(
    () => new Set(),
  );

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

  const permissionViews = useMemo<PermissionView[]>(
    () =>
      allPermissions.map((permission) => {
        const grantedRoles = roles.flatMap((role) => {
          const grant = grantsByRole.get(role.key)?.get(permission.code);
          if (!grant) return [];
          return [
            {
              roleKey: role.key,
              roleName: role.name || role.key,
              scope: grant.scope,
              scopeLabel: formatRbacScope(grant.scope),
              constraints: grant.constraints ?? {},
            },
          ];
        });

        return {
          ...permission,
          grantedRoles,
          actionLabel: formatActionLabel(permission.code),
        };
      }),
    [allPermissions, grantsByRole, roles],
  );

  const moduleOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: Array<{ value: string; label: string }> = [];
    permissionViews.forEach((permission) => {
      if (seen.has(permission.module)) return;
      seen.add(permission.module);
      options.push({
        value: permission.module,
        label: formatRbacScope(permission.module),
      });
    });
    return options;
  }, [permissionViews]);

  const filteredPermissions = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return permissionViews.filter((permission) => {
      if (moduleFilter !== "all" && permission.module !== moduleFilter) {
        return false;
      }
      if (
        roleFilter !== "all" &&
        !permission.grantedRoles.some((grant) => grant.roleKey === roleFilter)
      ) {
        return false;
      }
      if (unassignedOnly && permission.grantedRoles.length > 0) return false;
      if (!needle) return true;

      return (
        permission.name.toLowerCase().includes(needle) ||
        permission.code.toLowerCase().includes(needle) ||
        permission.description.toLowerCase().includes(needle) ||
        permission.module.toLowerCase().includes(needle) ||
        formatRbacScope(permission.module).toLowerCase().includes(needle) ||
        permission.grantedRoles.some(
          (grant) =>
            grant.roleName.toLowerCase().includes(needle) ||
            grant.roleKey.toLowerCase().includes(needle) ||
            grant.scopeLabel.toLowerCase().includes(needle),
        )
      );
    });
  }, [moduleFilter, permissionViews, roleFilter, search, unassignedOnly]);

  const moduleGroups = useMemo<ModuleGroup[]>(() => {
    const groups = new Map<string, ModuleGroup>();
    filteredPermissions.forEach((permission) => {
      const existing = groups.get(permission.module);
      const group =
        existing ??
        {
          module: permission.module,
          label: formatRbacScope(permission.module),
          permissions: [],
          grantedCount: 0,
        };
      group.permissions.push(permission);
      if (permission.grantedRoles.length > 0) group.grantedCount += 1;
      if (!existing) groups.set(permission.module, group);
    });
    return Array.from(groups.values());
  }, [filteredPermissions]);

  const summary = useMemo(() => {
    const modules = new Set(permissionViews.map((permission) => permission.module));
    const granted = permissionViews.filter(
      (permission) => permission.grantedRoles.length > 0,
    ).length;
    return {
      total: permissionViews.length,
      modules: modules.size,
      granted,
      unassigned: permissionViews.length - granted,
    };
  }, [permissionViews]);

  const hasActiveFilters =
    search.trim() !== "" ||
    moduleFilter !== "all" ||
    roleFilter !== "all" ||
    unassignedOnly;

  const retry = () => {
    void permissionsQuery.refetch();
    void rolesQuery.refetch();
  };

  const clearFilters = () => {
    setSearch("");
    setModuleFilter("all");
    setRoleFilter("all");
    setUnassignedOnly(false);
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

    const sections = moduleGroups
      .map((group) => {
        const rows = group.permissions
          .map((permission) => {
            const grantedRoles = permission.grantedRoles
              .map((grant) => `${grant.roleName} (${grant.scopeLabel})`)
              .join(", ");

            return `<tr>
              <td>
                <div class="name-row"><span class="name">${escapeHtml(permission.name || permission.code)}</span><span class="action">${escapeHtml(permission.actionLabel)}</span></div>
                <div class="code">${escapeHtml(permission.code)}</div>
              </td>
              <td>${escapeHtml(permission.description || "-")}</td>
              <td>${escapeHtml(grantedRoles || "Not granted to any role")}</td>
            </tr>`;
          })
          .join("");

        return `<section>
          <h2>${escapeHtml(group.label)} <span class="module-code">${escapeHtml(group.module)}</span> <span>${group.permissions.length} permissions · ${group.grantedCount} granted</span></h2>
          <table>
            <thead><tr><th>Permission</th><th>Description</th><th>Granted roles</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </section>`;
      })
      .join("");

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head><meta charset="utf-8" />
          <title>Raut permissions</title>
          <style>
            body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#0f172a;margin:28px}
            h1{font-size:22px;margin:0 0 4px}
            p{font-size:12px;color:#64748b;margin:0 0 18px}
            section{margin:0 0 22px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden}
            h2{font-size:14px;margin:0;padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;color:#0f172a}
            h2 span{font-size:11px;font-weight:500;color:#64748b;margin-left:6px}
            h2 .module-code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;color:#64748b;background:#fff;border:1px   solid   #e2e8f0; padding:1px 5px;border-radius:4px}
            table{width:100%;border-collapse:collapse}
            th,td{border-bottom:1px solid #e2e8f0;padding:10px 12px;font-size:11px;text-align:left;vertical-align:top}
            tr:last-child td{border-bottom:0}
            th{background:#fff;font-size:10px;text-transform:uppercase;letter-spacing:.03em;color:#475569}
            .name-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
            .name{font-weight:600;color:#0f172a}
            .action{font-size:10px;font-weight:600;color:#334155;background:#f1f5f9;border:1px solid #e2e8f0;padding:1px 6px;border-radius:999px}
            .code{margin-top:3px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;color:#94a3b8}
          </style>
        </head>
      <body>
        <h1>Permissions</h1>
        <p>Generated ${escapeHtml(new Date().toLocaleString())} · ${filteredPermissions.length} permissions shown${hasActiveFilters ? " (filtered)" : ""}</p>
        ${sections || "<p>No permissions match the selected filters.</p>"}
      </body>
    </html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const toggleModule = (module: string, open: boolean) => {
    setCollapsedModules((previous) => {
      const next = new Set(previous);
      if (open) next.delete(module);
      else next.add(module);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/settings/staffs"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-700"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Staff & Roles
          </Link>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Permissions
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            See what each permission allows and which roles can use it. Use scopes
            to understand whether access is platform-wide or limited.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={ printMatrix }
            disabled={ isLoading || isError }
            className="h-9 border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Printer className="size-4" aria-hidden="true" />
            Print
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={ exportMatrix }
            disabled={ isLoading || isError }
            className="h-9 border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="size-4" aria-hidden="true" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={ KeyRound }
          label="Total permissions"
          value={ summary.total }
          note="Available permission codes"
        />
        <SummaryCard
          icon={ Layers3 }
          label="Modules"
          value={ summary.modules }
          note="Functional permission groups"
        />
        <SummaryCard
          icon={ ShieldCheck }
          label="Granted to roles"
          value={ summary.granted }
          note="Assigned to at least one role"
        />
        <SummaryCard
          icon={ ShieldOff }
          label="Unassigned"
          value={ summary.unassigned }
          note="Not granted to any role"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-card sm:px-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Scope legend</h3>
            <p className="text-xs text-slate-500">
              Scopes show how broadly a granted role can use a permission.
            </p>
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          { SCOPE_LEGEND.map((item) => (
            <div
              key={ item.scope }
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <p className="text-xs font-semibold text-slate-700">{ item.label }</p>
              <p className="mt-0.5 text-xs text-slate-500">{ item.description }</p>
            </div>
          )) }
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="space-y-3 border-b border-slate-200 px-4 py-4 sm:px-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_12rem_auto] lg:items-end">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                Search permissions
              </span>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  value={ search }
                  onChange={ (event) => setSearch(event.target.value) }
                  placeholder="Search by name, code, description, or role"
                  aria-label="Search permissions"
                  disabled={ isLoading || isError }
                  className="h-9 bg-white pl-9"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                Module
              </span>
              <select
                value={ moduleFilter }
                onChange={ (event) => setModuleFilter(event.target.value) }
                aria-label="Filter by module"
                disabled={ isLoading || isError }
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:text-slate-400"
              >
                <option value="all">All modules</option>
                { moduleOptions.map((option) => (
                  <option key={ option.value } value={ option.value }>
                    { option.label }
                  </option>
                )) }
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                Role
              </span>
              <select
                value={ roleFilter }
                onChange={ (event) => setRoleFilter(event.target.value) }
                aria-label="Filter by role"
                disabled={ isLoading || isError }
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:text-slate-400"
              >
                <option value="all">All roles</option>
                { roles.map((role) => (
                  <option key={ role.key } value={ role.key }>
                    { role.name || role.key }
                  </option>
                )) }
              </select>
            </label>

            <label className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
              <Checkbox
                checked={ unassignedOnly }
                onCheckedChange={ (checked) => setUnassignedOnly(Boolean(checked)) }
                disabled={ isLoading || isError }
                aria-label="Show unassigned permissions only"
              />
              <span className="font-medium">Unassigned only</span>
            </label>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500" aria-live="polite">
              Showing{ " " }
              <span className="font-semibold text-slate-700">
                { filteredPermissions.length }
              </span>{ " " }
              of{ " " }
              <span className="font-semibold text-slate-700">
                { allPermissions.length }
              </span>{ " " }
              permissions
              { hasActiveFilters ? " with active filters" : "" }
            </p>
            { hasActiveFilters ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={ clearFilters }
                className="h-auto px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                <FilterX className="size-3.5" aria-hidden="true" />
                Clear filters
              </Button>
            ) : null }
          </div>
        </div>

        { isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <TableSkeleton rows={ 10 } cols={ 4 } mobileCols={ 2 } lgCols={ 4 } />
            </table>
          </div>
        ) : isError ? (
          <QueryError
            error={ permissionsQuery.error ?? rolesQuery.error }
            onRetry={ retry }
          />
        ) : moduleGroups.length === 0 ? (
          <div className="px-4 py-12 text-center sm:px-5">
            <p className="text-sm font-medium text-slate-700">
              No permissions match these filters.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Try a different search, module, role, or clear the filters.
            </p>
            { hasActiveFilters ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={ clearFilters }
                className="mt-4 h-9 border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Clear filters
              </Button>
            ) : null }
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            { moduleGroups.map((group) => {
              const open = !collapsedModules.has(group.module);
              const unassignedCount = group.permissions.length - group.grantedCount;

              return (
                <Collapsible
                  key={ group.module }
                  open={ open }
                  onOpenChange={ (nextOpen) => toggleModule(group.module, nextOpen) }
                  className="bg-white"
                >
                  <div className="border-y border-slate-200 bg-slate-100/80 px-4 py-3 first:border-t-0 sm:px-5">
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex w-full items-start justify-between gap-3 text-left"
                        aria-label={ `${open ? "Collapse" : "Expand"} ${group.label} module` }
                      >
                        <div className="min-w-0">
                          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Module
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold tracking-tight text-slate-900">
                              { group.label }
                            </h3>
                          </div>
                          {/* <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-medium">
                              { group.permissions.length } permission
                              { group.permissions.length === 1 ? "" : "s" }
                            </span>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                              { group.grantedCount } granted
                            </span>
                            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-medium text-slate-600">
                              { unassignedCount } unassigned
                            </span>
                          </div> */}
                        </div>
                        <ChevronDown
                          className={ `mt-1 size-4 shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}` }
                          aria-hidden="true"
                        />
                      </button>
                    </CollapsibleTrigger>
                  </div>

                  <CollapsibleContent>
                    <div className="divide-y divide-slate-100 bg-white">
                      { group.permissions.map((permission) => (
                        <article
                          key={ permission.code }
                          className="grid gap-4 px-4 py-4 transition-colors hover:bg-slate-50/40 sm:px-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]"
                        >
                          <div className="min-w-0 border-l-2 border-slate-200 pl-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-sm font-semibold text-slate-900">
                                { permission.name || permission.code }
                              </h4>
                              <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-600">
                                { permission.actionLabel }
                              </span>
                            </div>
                            <p className="mt-1.5 text-sm leading-6 text-slate-600">
                              { permission.description || "No description provided." }
                            </p>
                          </div>

                          <div className="xl:pl-2">
                            <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-slate-500">
                              Granted roles
                            </p>
                            { permission.grantedRoles.length > 0 ? (
                              <div className="mt-2 flex flex-wrap gap-2">
                                { permission.grantedRoles.map((grant) => (
                                  <span
                                    key={ `${permission.code}-${grant.roleKey}` }
                                    title={ grantTitle(grant) }
                                    className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 shadow-sm"
                                  >
                                    <span className="font-medium text-slate-800">
                                      { grant.roleName }
                                    </span>
                                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-600">
                                      { grant.scopeLabel }
                                    </span>
                                  </span>
                                )) }
                              </div>
                            ) : (
                              <div className="mt-2">
                                <span className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                                  Not granted to any role
                                </span>
                              </div>
                            ) }
                          </div>
                        </article>
                      )) }
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            }) }
          </div>
        ) }
      </div>
    </div>
  );
}