import type {
  RbacCatalogPermission,
  RbacCatalogRole,
  RbacRolePermission,
} from "@/types/rbac";

export type RbacGrantLookup = Map<string, Map<string, RbacRolePermission>>;

const titleCase = (value) =>
  String(value ?? "")
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");

const csvEscape = (value: unknown) => {
  const text = value === null || value === undefined ? "" : String(value);

  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const csvRow = (...cells: unknown[]) => cells.map(csvEscape).join(",");

export function formatRbacScope(scope: string) {
  const normalized = String(scope ?? "").trim().toLowerCase();
  const labels: Record<string, string> = {
    platform: "Platform",
    region: "Region",
    assigned: "Assigned",
    own: "Own",
  };

  return labels[normalized] ?? (normalized ? titleCase(normalized) : "Scoped");
}

export function buildRbacGrantLookup(roles: RbacCatalogRole[]): RbacGrantLookup {
  const lookup: RbacGrantLookup = new Map();

  roles.forEach((role) => {
    const grants = new Map<string, RbacRolePermission>();

    role.permissions.forEach((permission) => {
      if (permission.code) grants.set(permission.code, permission);
    });

    lookup.set(role.key, grants);
  });

  return lookup;
}

export function mergeRbacPermissionCatalog(
  permissions: RbacCatalogPermission[],
  roles: RbacCatalogRole[],
): RbacCatalogPermission[] {
  const known = new Map(permissions.map((permission) => [permission.code, permission]));
  const missing = new Map<string, RbacCatalogPermission>();

  roles.forEach((role) => {
    role.permissions.forEach((grant) => {
      if (!grant.code || known.has(grant.code) || missing.has(grant.code)) return;

      missing.set(grant.code, {
        code: grant.code,
        name: titleCase(grant.code),
        description: "Granted to a role but not present in the permission catalog.",
        module: "uncatalogued",
        createdAt: null,
      });
    });
  });

  return [...permissions, ...missing.values()].sort(
    (a, b) =>
      a.module.localeCompare(b.module) ||
      a.name.localeCompare(b.name) ||
      a.code.localeCompare(b.code),
  );
}

export function buildRbacMatrixCsv(
  permissions: RbacCatalogPermission[],
  roles: RbacCatalogRole[],
) {
  const grantsByRole = buildRbacGrantLookup(roles);
  const header = csvRow(
    "Permission",
    "Code",
    "Module",
    ...roles.map((role) => role.name || role.key),
  );
  const rows = permissions.map((permission) =>
    csvRow(
      permission.name,
      permission.code,
      titleCase(permission.module),
      ...roles.map((role) => {
        const grant = grantsByRole.get(role.key)?.get(permission.code);

        return grant
          ? `Granted (${formatRbacScope(grant.scope)})`
          : "Not granted";
      }),
    ),
  );

  return [header, ...rows].join("\n");
}

export function downloadRbacMatrixCsv(
  permissions: RbacCatalogPermission[],
  roles: RbacCatalogRole[],
) {
  const content = buildRbacMatrixCsv(permissions, roles);
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `raut-role-permissions-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
