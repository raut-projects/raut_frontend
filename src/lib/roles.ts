// Role normalization and admin-role resolution. Maps the many role spellings the
// backend or session may send onto canonical keys, decides whether a role is an
// admin, and picks the single role that governs access. Admin roles default to
// ["admin", "super_admin"] when NEXT_PUBLIC_ADMIN_ROLES is unset.

import { ADMIN_ROLES_RAW } from "./env";

// Maps known role spellings (hyphen/underscore/plain) onto canonical keys.
const ROLE_ALIASES = {
  admin: "admin",
  administrator: "admin",
  super_admin: "super_admin",
  superadmin: "super_admin",
  "super-admin": "super_admin",
  owner: "super_admin",
  platform_manager: "platform_manager",
  "platform-manager": "platform_manager",
  operations_agent: "operations_agent",
  "operations-agent": "operations_agent",
  operations: "operations_agent",
  operator: "operator",
  support_agent: "support_agent",
  "support-agent": "support_agent",
  support: "support",
  analyst: "analyst",
  read_only: "analyst",
  finance_manager: "finance_manager",
  "finance-manager": "finance_manager",
  finance_agent: "finance_agent",
  "finance-agent": "finance_agent",
  finance: "finance",
  marketing_manager: "marketing_manager",
  "marketing-manager": "marketing_manager",
  marketing_agent: "marketing_agent",
  "marketing-agent": "marketing_agent",
  marketing: "marketing",
};

/**
 * Normalizes a role string to its canonical key.
 *
 * Trims and lowercases the input, maps known aliases, and returns null for empty
 * input. Unknown roles are returned unchanged so they can still be displayed.
 */
export const normalizeRole = (role) => {
  const value = String(role ?? "")
    .trim()
    .toLowerCase();

  if (!value) return null;

  return ROLE_ALIASES[value] ?? value;
};

// Admin roles come from NEXT_PUBLIC_ADMIN_ROLES (comma-separated); fall back to
// the two built-in roles when the variable is unset or empty.
const configuredAdminRoles = ADMIN_ROLES_RAW.split(",")
  .map((role) => normalizeRole(role))
  .filter(Boolean);

/** Canonical role keys that grant admin access. */
export const ADMIN_ROLES = configuredAdminRoles.length
  ? configuredAdminRoles
  : ["admin", "super_admin"];

/** Returns true when `role` normalizes to one of {@link ADMIN_ROLES}. */
export const isAdminRole = (role) => {
  const normalized = normalizeRole(role);

  return normalized !== null && ADMIN_ROLES.includes(normalized);
};

// Flattens every candidate into a list of usable roles. A candidate is either
// a single role or a list of roles, and empty values are dropped.
/**
 * Flattens role candidates (single roles or arrays) into a normalized list,
 * dropping empty or unknown-to-normalize entries.
 */
export const collectRoles = (...candidates) => {
  const roles = [];

  for (const candidate of candidates) {
    const entries = Array.isArray(candidate) ? candidate : [candidate];

    for (const entry of entries) {
      const normalized = normalizeRole(entry);

      if (normalized) roles.push(normalized);
    }
  }

  return roles;
};

/** Returns the first normalized role across all candidates, or null. */
export const firstRole = (...candidates) =>
  collectRoles(...candidates)[0] ?? null;

// Picks the role that decides access. The first source that carries a role
// wins, and inside that source a role that grants admin access wins over the
// others, so `roles: ['user', 'admin']` is treated as an admin.
/**
 * Selects the decisive role across the given sources.
 *
 * The first source containing any role wins; within it, an admin role is
 * preferred over other roles, otherwise its first role is used. Returns null
 * when no source carries a role.
 */
export const resolveRole = (...candidates) => {
  for (const candidate of candidates) {
    const entries = Array.isArray(candidate) ? candidate : [candidate];
    const roles = entries.map((entry) => normalizeRole(entry)).filter(Boolean);

    if (roles.length === 0) continue;

    return roles.find((role) => ADMIN_ROLES.includes(role)) ?? roles[0];
  }

  return null;
};

/** Formats a role key as a title-cased label, e.g. "super_admin" -> "Super Admin". */
export const formatRole = (role) => {
  const normalized = normalizeRole(role);

  if (!normalized) return "User";

  return normalized
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};
