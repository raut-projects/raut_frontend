const ROLE_ALIASES = {
  admin: 'admin',
  administrator: 'admin',
  super_admin: 'super_admin',
  superadmin: 'super_admin',
  'super-admin': 'super_admin',
  owner: 'super_admin',
}

export const normalizeRole = (role) => {
  const value = String(role ?? '').trim().toLowerCase()

  if (!value) return null

  return ROLE_ALIASES[value] ?? value
}

const configuredAdminRoles = (import.meta.env?.VITE_ADMIN_ROLES ?? '')
  .split(',')
  .map((role) => normalizeRole(role))
  .filter(Boolean)

export const ADMIN_ROLES = configuredAdminRoles.length
  ? configuredAdminRoles
  : ['admin', 'super_admin']

export const isAdminRole = (role) => {
  const normalized = normalizeRole(role)

  return normalized !== null && ADMIN_ROLES.includes(normalized)
}

// Flattens every candidate into a list of usable roles. A candidate is either
// a single role or a list of roles, and empty values are dropped.
export const collectRoles = (...candidates) => {
  const roles = []

  for (const candidate of candidates) {
    const entries = Array.isArray(candidate) ? candidate : [candidate]

    for (const entry of entries) {
      const normalized = normalizeRole(entry)

      if (normalized) roles.push(normalized)
    }
  }

  return roles
}

export const firstRole = (...candidates) => collectRoles(...candidates)[0] ?? null

// Picks the role that decides access. The first source that carries a role
// wins, and inside that source a role that grants admin access wins over the
// others, so `roles: ['user', 'admin']` is treated as an admin.
export const resolveRole = (...candidates) => {
  for (const candidate of candidates) {
    const entries = Array.isArray(candidate) ? candidate : [candidate]
    const roles = entries.map((entry) => normalizeRole(entry)).filter(Boolean)

    if (roles.length === 0) continue

    return roles.find((role) => ADMIN_ROLES.includes(role)) ?? roles[0]
  }

  return null
}

export const formatRole = (role) => {
  const normalized = normalizeRole(role)

  if (!normalized) return 'User'

  return normalized
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}
