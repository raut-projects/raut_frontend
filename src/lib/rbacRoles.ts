import type { RbacCatalogRole } from "@/types/rbac";

const ROLE_TONES = [
  "border-violet-200 bg-violet-50 text-violet-700",
  "border-indigo-200 bg-indigo-50 text-indigo-700",
  "border-sky-200 bg-sky-50 text-sky-700",
  "border-teal-200 bg-teal-50 text-teal-700",
  "border-emerald-200 bg-emerald-50 text-emerald-700",
  "border-lime-200 bg-lime-50 text-lime-700",
  "border-amber-200 bg-amber-50 text-amber-700",
  "border-orange-200 bg-orange-50 text-orange-700",
  "border-rose-200 bg-rose-50 text-rose-700",
  "border-slate-200 bg-slate-100 text-slate-600",
];

const roleKey = (role: RbacCatalogRole | string | null | undefined) =>
  typeof role === "string" ? role : (role?.key ?? "");

const roleName = (role: RbacCatalogRole | string | null | undefined) =>
  typeof role === "string" ? "" : (role?.name ?? "");

export function formatRoleKey(value: unknown) {
  const text = String(value ?? "")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  if (!text) return "User";

  return text
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const normalizeRoleKey = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

const NON_ASSIGNABLE_STAFF_ROLE_KEYS = new Set(["super_admin"]);

export function isAssignableStaffRole(role: RbacCatalogRole) {
  if (!role.id) return false;
  return !NON_ASSIGNABLE_STAFF_ROLE_KEYS.has(normalizeRoleKey(role.key));
}

export function findCatalogRole(
  roles: RbacCatalogRole[],
  key: string | null | undefined,
) {
  const normalized = normalizeRoleKey(key);

  if (!normalized) return undefined;

  return roles.find((role) => normalizeRoleKey(role.key) === normalized);
}

export function roleDisplayName(
  role: RbacCatalogRole | string | null | undefined,
) {
  const catalogName = roleName(role).trim();

  return catalogName || formatRoleKey(roleKey(role) || roleName(role));
}

export function roleCatalogDescription(
  role: RbacCatalogRole | string | null | undefined,
) {
  if (typeof role !== "string" && role?.description?.trim()) {
    return role.description.trim();
  }

  return "";
}

export function roleToneFor(
  role: RbacCatalogRole | string | null | undefined,
) {
  const source = normalizeRoleKey(roleKey(role)) || normalizeRoleKey(roleName(role)) || "role";
  let hash = 7;

  for (const character of source) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return ROLE_TONES[hash % ROLE_TONES.length];
}
