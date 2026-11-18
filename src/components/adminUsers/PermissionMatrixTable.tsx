import {
  formatRbacScope,
  type RbacGrantLookup,
} from "@/lib/rbacCatalog";
import type { RbacCatalogPermission, RbacCatalogRole } from "@/types/rbac";

const CELL_STYLES = {
  granted: "border-emerald-200 bg-emerald-50 text-emerald-700",
  scoped: "border-sky-200 bg-sky-50 text-sky-700",
  none: "border-slate-200 bg-slate-50 text-slate-400",
};

type PermissionMatrixTableProps = {
  permissions: RbacCatalogPermission[];
  roles: RbacCatalogRole[];
  grantsByRole: RbacGrantLookup;
  roleFilter?: string | "all";
};

export function PermissionMatrixTable({
  permissions,
  roles,
  grantsByRole,
  roleFilter = "all",
}: PermissionMatrixTableProps) {
  const visibleRoles =
    roleFilter === "all"
      ? roles
      : roles.filter((role) => role.key === roleFilter);
  const minWidth = `${Math.max(52, 13 + visibleRoles.length * 9)}rem`;

  return (
    <div className="overflow-x-auto">
      <table
        className="w-full border-collapse text-left"
        style={{ minWidth }}
      >
        <thead>
          <tr>
            <th className="sticky left-0 z-10 min-w-[13rem] border-b border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-600">
              Permission
            </th>
            {visibleRoles.map((role) => (
              <th
                key={role.key}
                scope="col"
                className="border-b border-slate-200 bg-slate-50 px-2 py-2.5 text-center text-[0.7rem] font-semibold whitespace-nowrap text-slate-600"
              >
                <span className="block">{role.name || role.key}</span>
                <span className="mt-0.5 block text-[0.6rem] font-normal text-slate-400">
                  {role.key}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {permissions.map((permission) => (
            <tr
              key={permission.code}
              className="border-b border-slate-100"
            >
              <th
                scope="row"
                title={permission.description || permission.code}
                className="sticky left-0 z-10 border-r border-slate-100 bg-white px-3 py-2 text-left"
              >
                <span className="block text-xs font-medium text-slate-700">
                  {permission.name || permission.code}
                </span>
                <span className="mt-0.5 block text-[0.65rem] text-slate-400">
                  {permission.code} · {formatRbacScope(permission.module)}
                </span>
              </th>
              {visibleRoles.map((role) => {
                const grant = grantsByRole.get(role.key)?.get(permission.code);
                const scope = grant ? formatRbacScope(grant.scope) : "";
                const label = grant ? `Granted · ${scope}` : "Not granted";
                const cellStyle = !grant
                  ? CELL_STYLES.none
                  : grant.scope === "platform"
                    ? CELL_STYLES.granted
                    : CELL_STYLES.scoped;
                const hasConstraints = Boolean(
                  grant && Object.keys(grant.constraints ?? {}).length,
                );
                const tooltip = grant
                  ? hasConstraints
                    ? `${label}\n${JSON.stringify(grant.constraints, null, 2)}`
                    : `${label}\nNo constraints`
                  : label;

                return (
                  <td key={role.key} className="px-2 py-2 text-center">
                    <span
                      title={tooltip}
                      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[0.7rem] font-medium whitespace-nowrap ${cellStyle}`}
                    >
                      <span aria-hidden="true">
                        {grant ? "\u2713" : "\u2014"}
                      </span>
                      {label}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
