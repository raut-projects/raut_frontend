import {
  ADMIN_ROLES,
  PERMISSION_LEVEL_GLYPHS,
  PERMISSION_LEVEL_LABELS,
  PERMISSION_MATRIX,
  type AdminRoleKey,
  type PermissionFeatureRow,
  type PermissionLevel,
} from "@/lib/adminUsers";

const CELL_STYLES: Record<PermissionLevel, string> = {
  full: "border-emerald-200 bg-emerald-50 text-emerald-700",
  limited: "border-amber-200 bg-amber-50 text-amber-700",
  none: "border-slate-200 bg-slate-50 text-slate-400",
  own: "border-sky-200 bg-sky-50 text-sky-700",
  finance: "border-teal-200 bg-teal-50 text-teal-700",
  marketing: "border-violet-200 bg-violet-50 text-violet-700",
};

type PermissionMatrixTableProps = {
  roles?: AdminRoleKey[];
  features: PermissionFeatureRow[];
  roleFilter?: AdminRoleKey | "all";
};

export function PermissionMatrixTable({
  roles,
  features,
  roleFilter = "all",
}: PermissionMatrixTableProps) {
  const visibleRoles =
    roleFilter === "all"
      ? (roles ?? ADMIN_ROLES.map((role) => role.key))
      : [roleFilter];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[52rem] border-collapse text-left">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 min-w-[13rem] border-b border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-600">
              Feature
            </th>
            {visibleRoles.map((roleKey) => {
              const role = ADMIN_ROLES.find((entry) => entry.key === roleKey);

              return (
                <th
                  key={roleKey}
                  scope="col"
                  className="border-b border-slate-200 bg-slate-50 px-2 py-2.5 text-center text-[0.7rem] font-semibold whitespace-nowrap text-slate-600"
                >
                  {role?.label ?? roleKey}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {features.map((feature) => (
            <tr key={feature.key} className="border-b border-slate-100">
              <th
                scope="row"
                className="sticky left-0 z-10 border-r border-slate-100 bg-white px-3 py-2 text-left"
              >
                <span className="block text-xs font-medium text-slate-700">
                  {feature.label}
                </span>
                <span className="block text-[0.65rem] text-slate-400">
                  {feature.group}
                </span>
              </th>
              {visibleRoles.map((roleKey) => {
                const level = PERMISSION_MATRIX[feature.key][roleKey];

                return (
                  <td key={roleKey} className="px-2 py-2 text-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[0.7rem] font-medium whitespace-nowrap ${CELL_STYLES[level]}`}
                    >
                      <span aria-hidden="true">
                        {PERMISSION_LEVEL_GLYPHS[level]}
                      </span>
                      {PERMISSION_LEVEL_LABELS[level]}
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
