export const normalizeRole = (role) => {
  const value = String(role ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  return value || null;
};

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

export const firstRole = (...candidates) =>
  collectRoles(...candidates)[0] ?? null;

export const resolveRole = (...candidates) => {
  for (const candidate of candidates) {
    const entries = Array.isArray(candidate) ? candidate : [candidate];
    const roles = entries.map((entry) => normalizeRole(entry)).filter(Boolean);

    if (roles.length > 0) return roles[0];
  }

  return null;
};

export const formatRole = (role) => {
  const value = String(role ?? "")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  if (!value) return "User";

  return value.replace(/\b\w/g, (character) => character.toUpperCase());
};

const ROLE_LABEL_KEYS = [
  "role_label",
  "roleLabel",
  "role_name",
  "roleName",
  "role_display_name",
  "roleDisplayName",
  "role_title",
  "roleTitle",
];

const readRoleLabel = (source) => {
  if (!source || typeof source !== "object") return "";

  if (Array.isArray(source)) {
    for (const entry of source) {
      const label = readRoleLabel(entry);

      if (label) return label;
    }

    return "";
  }

  for (const key of ROLE_LABEL_KEYS) {
    const value = source[key];

    if (typeof value === "string" && value.trim()) return value.trim();
  }

  for (const key of ["role", "role_assignment", "roleAssignment"]) {
    const nested = source[key];

    if (nested && typeof nested === "object" && nested !== source) {
      const label = readRoleLabel(nested);

      if (label) return label;
    }
  }

  return "";
};

export const roleLabelFromPayload = (...sources) => {
  for (const source of sources) {
    const label = readRoleLabel(source);

    if (label) return label;
  }

  return "";
};
