// Admin user domain model and role/permission helpers for the admin settings
// area. Defines roles, statuses, the feature permission matrix, user shapes and
// API payloads, plus normalization/formatting utilities and a permission-matrix
// CSV export. Pure data and helpers only; it does not call the API.

/** Lifecycle state of an admin account. */
export type AdminUserStatus = "active" | "invited" | "deactivated";

/**
 * Access level granted for a feature:
 * - full: complete access
 * - limited: read or restricted access
 * - none: no access
 * - own: only the user's own records
 * - finance: finance-scoped records
 * - marketing: marketing-scoped records
 */
export type PermissionLevel =
  | "full"
  | "limited"
  | "none"
  | "own"
  | "finance"
  | "marketing";

/** Canonical key for each built-in admin role. */
export type AdminRoleKey =
  | "super_admin"
  | "platform_manager"
  | "operations_agent"
  | "support_agent"
  | "finance_manager"
  | "finance_agent"
  | "marketing_manager"
  | "marketing_agent"
  | "analyst";

/** Presentation metadata for an admin role. */
export type AdminRole = {
  key: AdminRoleKey;
  label: string;
  description: string;
  tone: string;
};

/** All built-in admin roles, in display order. */
export const ADMIN_ROLES: AdminRole[] = [
  {
    key: "super_admin",
    label: "Super Admin",
    description: "Full access to every module, including admin users and configuration.",
    tone: "border-violet-200 bg-violet-50 text-violet-700",
  },
  {
    key: "platform_manager",
    label: "Platform Manager",
    description: "Runs the platform day to day and manages configuration.",
    tone: "border-indigo-200 bg-indigo-50 text-indigo-700",
  },
  {
    key: "operations_agent",
    label: "Operations Agent",
    description: "Handles live rides, routes, drivers and customer operations.",
    tone: "border-sky-200 bg-sky-50 text-sky-700",
  },
  {
    key: "support_agent",
    label: "Support Agent",
    description: "Responds to support tickets and assists customers.",
    tone: "border-teal-200 bg-teal-50 text-teal-700",
  },
  {
    key: "finance_manager",
    label: "Finance Manager",
    description: "Owns payouts, transactions and financial reporting.",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  {
    key: "finance_agent",
    label: "Finance Agent",
    description: "Handles payouts and transactions for the finance team.",
    tone: "border-lime-200 bg-lime-50 text-lime-700",
  },
  {
    key: "marketing_manager",
    label: "Marketing Manager",
    description: "Manages promotions, referrals and marketing campaigns.",
    tone: "border-amber-200 bg-amber-50 text-amber-700",
  },
  {
    key: "marketing_agent",
    label: "Marketing Agent",
    description: "Runs promotions and referral campaigns for the marketing team.",
    tone: "border-orange-200 bg-orange-50 text-orange-700",
  },
  {
    key: "analyst",
    label: "Analyst",
    description: "Read-only access to data, reports and audit history.",
    tone: "border-slate-200 bg-slate-100 text-slate-600",
  },
];

/** Role key to display label lookup, derived from {@link ADMIN_ROLES}. */
export const ADMIN_ROLE_LABELS: Record<AdminRoleKey, string> = ADMIN_ROLES.reduce(
  (labels, role) => {
    labels[role.key] = role.label;
    return labels;
  },
  {} as Record<AdminRoleKey, string>,
);

/** Role key to Tailwind badge class lookup, derived from {@link ADMIN_ROLES}. */
export const ADMIN_ROLE_TONES: Record<AdminRoleKey, string> = ADMIN_ROLES.reduce(
  (tones, role) => {
    tones[role.key] = role.tone;
    return tones;
  },
  {} as Record<AdminRoleKey, string>,
);

/** Status to display label lookup. */
export const ADMIN_STATUS_LABELS: Record<AdminUserStatus, string> = {
  active: "Active",
  invited: "Invited",
  deactivated: "Deactivated",
};

/** Status to Tailwind badge class lookup. */
export const ADMIN_STATUS_TONES: Record<AdminUserStatus, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  invited: "border-amber-200 bg-amber-50 text-amber-700",
  deactivated: "border-slate-200 bg-slate-100 text-slate-600",
};

/** Feature that can be permitted or restricted for an admin. */
export type PermissionFeature =
  | "dashboard"
  | "live_rides"
  | "drivers"
  | "customers"
  | "rides"
  | "routes"
  | "payouts"
  | "transactions"
  | "promotions"
  | "referrals"
  | "support"
  | "analytics"
  | "platform_config"
  | "admin_users"
  | "audit_logs"
  | "system_health";

/** A permission feature with its display label and grouping. */
export type PermissionFeatureRow = {
  key: PermissionFeature;
  label: string;
  group: string;
};

/** All permission features with labels and groups, in display order. */
export const PERMISSION_FEATURES: PermissionFeatureRow[] = [
  { key: "dashboard", label: "Dashboard", group: "Overview" },
  { key: "live_rides", label: "Live Rides", group: "Operations" },
  { key: "drivers", label: "Drivers", group: "Operations" },
  { key: "customers", label: "Customers", group: "Operations" },
  { key: "rides", label: "Rides", group: "Operations" },
  { key: "routes", label: "Routes", group: "Operations" },
  { key: "payouts", label: "Payouts", group: "Finance" },
  { key: "transactions", label: "Transactions", group: "Finance" },
  { key: "promotions", label: "Promotions", group: "Marketing" },
  { key: "referrals", label: "Referrals", group: "Marketing" },
  { key: "support", label: "Support", group: "Support" },
  { key: "analytics", label: "Analytics", group: "Insights" },
  { key: "platform_config", label: "Platform Config", group: "Settings" },
  { key: "admin_users", label: "Admin Users", group: "Settings" },
  { key: "audit_logs", label: "Audit Logs", group: "Settings" },
  { key: "system_health", label: "System Health", group: "Settings" },
];

// Baseline: every role starts at "full"; column() applies per-feature overrides.
const ALL: Record<AdminRoleKey, PermissionLevel> = {
  super_admin: "full",
  platform_manager: "full",
  operations_agent: "full",
  support_agent: "full",
  finance_manager: "full",
  finance_agent: "full",
  marketing_manager: "full",
  marketing_agent: "full",
  analyst: "full",
};

/** Builds a permission column by overriding selected roles on the "full" baseline. */
const column = (
  values: Partial<Record<AdminRoleKey, PermissionLevel>>,
): Record<AdminRoleKey, PermissionLevel> => ({ ...ALL, ...values });

/**
 * Permission level for every feature and role. Each column starts from the
 * "full" baseline and downgrades specific roles.
 */
export const PERMISSION_MATRIX: Record<
  PermissionFeature,
  Record<AdminRoleKey, PermissionLevel>
> = {
  dashboard: column({}),
  live_rides: column({
    finance_manager: "none",
    finance_agent: "none",
    marketing_manager: "none",
    marketing_agent: "none",
  }),
  drivers: column({
    support_agent: "none",
    finance_manager: "none",
    finance_agent: "none",
    marketing_manager: "none",
    marketing_agent: "none",
  }),
  customers: column({
    finance_manager: "none",
    finance_agent: "none",
    marketing_manager: "none",
    marketing_agent: "none",
  }),
  rides: column({
    finance_manager: "none",
    finance_agent: "none",
    marketing_manager: "none",
    marketing_agent: "none",
  }),
  routes: column({
    finance_manager: "none",
    finance_agent: "none",
    marketing_manager: "none",
    marketing_agent: "none",
  }),
  payouts: column({
    platform_manager: "limited",
    operations_agent: "none",
    support_agent: "none",
    marketing_manager: "none",
    marketing_agent: "none",
  }),
  transactions: column({
    platform_manager: "limited",
    operations_agent: "none",
    support_agent: "none",
    marketing_manager: "none",
    marketing_agent: "none",
  }),
  promotions: column({
    platform_manager: "limited",
    operations_agent: "none",
    support_agent: "none",
    finance_manager: "none",
    finance_agent: "none",
  }),
  referrals: column({
    platform_manager: "limited",
    operations_agent: "none",
    support_agent: "none",
    finance_manager: "none",
    finance_agent: "none",
  }),
  support: column({
    finance_manager: "none",
    finance_agent: "none",
    marketing_manager: "none",
    marketing_agent: "none",
    analyst: "none",
  }),
  analytics: column({}),
  platform_config: column({
    platform_manager: "none",
    operations_agent: "none",
    support_agent: "none",
    finance_manager: "none",
    finance_agent: "none",
    marketing_manager: "none",
    marketing_agent: "none",
    analyst: "none",
  }),
  admin_users: column({
    platform_manager: "none",
    operations_agent: "none",
    support_agent: "none",
    finance_manager: "none",
    finance_agent: "none",
    marketing_manager: "none",
    marketing_agent: "none",
    analyst: "none",
  }),
  audit_logs: column({
    platform_manager: "own",
    operations_agent: "none",
    support_agent: "none",
    finance_manager: "finance",
    finance_agent: "finance",
    marketing_manager: "marketing",
    marketing_agent: "marketing",
  }),
  system_health: column({
    operations_agent: "none",
    support_agent: "none",
    finance_manager: "none",
    finance_agent: "none",
    marketing_manager: "none",
    marketing_agent: "none",
    analyst: "none",
  }),
};

/** Permission level to display label lookup. */
export const PERMISSION_LEVEL_LABELS: Record<PermissionLevel, string> = {
  full: "Full",
  limited: "Limited",
  none: "No access",
  own: "Own only",
  finance: "Finance scope",
  marketing: "Marketing scope",
};

/** Permission level to single-character glyph lookup (Unicode escapes). */
export const PERMISSION_LEVEL_GLYPHS: Record<PermissionLevel, string> = {
  full: "\u2713",
  limited: "\u25d0",
  none: "\u2014",
  own: "\u25ce",
  finance: "\u0192",
  marketing: "\u25c8",
};

/** Per-feature permission overrides applied on top of a role's defaults. */
export type PermissionOverrides = Partial<
  Record<PermissionFeature, PermissionLevel>
>;

/** A single admin user account. Timestamps are ISO strings. */
export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AdminRoleKey;
  status: AdminUserStatus;
  lastLoginAt: string | null;
  isOnline: boolean;
  twoFactorRequired: boolean;
  permissions?: PermissionOverrides;
  invitedAt?: string;
  deactivatedAt?: string;
  createdAt: string;
};

/** Filter options for the admin user list. */
export type AdminUserFilters = {
  status?: AdminUserStatus | "all";
  search?: string;
};

/** Admin user list filters plus pagination. */
export type AdminUserListParams = AdminUserFilters & {
  page?: number;
  limit?: number;
};

/** Paginated admin user list response. */
export type AdminUserListResult = {
  items: AdminUser[];
  total: number;
  page: number;
  limit: number;
};

/** Form values used when inviting or editing an admin user. */
export type AdminUserFormValues = {
  name: string;
  phone: string;
  email: string;
  role: AdminRoleKey;
  twoFactorRequired: boolean;
  sendWelcomeSms: boolean;
};

/** Request body for inviting a new admin user (snake_case API fields). */
export type AdminUserInvitePayload = {
  name: string;
  phone: string;
  email: string;
  role: AdminRoleKey;
  permissions?: PermissionOverrides;
  two_factor_required: boolean;
  send_welcome_sms: boolean;
};

/** Request body for updating an admin user's role and permissions. */
export type AdminUserUpdatePayload = {
  role: AdminRoleKey;
  permissions?: PermissionOverrides;
  two_factor_required: boolean;
};

/** Default values for the invite form. */
export const ADMIN_USER_DEFAULT_FORM: AdminUserFormValues = {
  name: "",
  phone: "",
  email: "",
  role: "support_agent",
  twoFactorRequired: true,
  sendWelcomeSms: true,
};

/** Maps accepted role spellings to canonical admin role keys. */
const ROLE_ALIASES: Record<string, AdminRoleKey> = {
  super_admin: "super_admin",
  superadmin: "super_admin",
  "super-admin": "super_admin",
  owner: "super_admin",
  admin: "super_admin",
  administrator: "super_admin",
  platform_manager: "platform_manager",
  "platform-manager": "platform_manager",
  operations_agent: "operations_agent",
  operations: "operations_agent",
  operator: "operations_agent",
  support_agent: "support_agent",
  support: "support_agent",
  "support-agent": "support_agent",
  finance_manager: "finance_manager",
  finance: "finance_manager",
  finance_agent: "finance_agent",
  marketing_manager: "marketing_manager",
  marketing: "marketing_manager",
  marketing_agent: "marketing_agent",
  analyst: "analyst",
  read_only: "analyst",
};

/**
 * Normalizes any role value to a canonical admin role key.
 *
 * Trims, lowercases and collapses whitespace to underscores before alias
 * lookup; unknown values fall back to "analyst" (least privilege).
 */
export function normalizeAdminRole(value: unknown): AdminRoleKey {
  const key = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  return ROLE_ALIASES[key] ?? "analyst";
}

/**
 * Normalizes any status value to an admin user status.
 *
 * Maps pending/invite variants to "invited" and inactive/disabled/suspended
 * variants to "deactivated"; anything else is treated as "active".
 */
export function normalizeAdminStatus(value: unknown): AdminUserStatus {
  const status = String(value ?? "").trim().toLowerCase();

  if (status === "invited" || status === "pending" || status === "pending_invite") {
    return "invited";
  }

  if (
    status === "deactivated" ||
    status === "inactive" ||
    status === "disabled" ||
    status === "suspended"
  ) {
    return "deactivated";
  }

  return "active";
}

/** Returns the display label for a role value, defaulting to "Analyst". */
export function roleLabel(role: string) {
  const key = normalizeAdminRole(role);

  return ADMIN_ROLE_LABELS[key] ?? "Analyst";
}

/** Returns the description for a role value, or an empty string. */
export function roleDescription(role: string) {
  const key = normalizeAdminRole(role);

  return (
    ADMIN_ROLES.find((entry) => entry.key === key)?.description ?? ""
  );
}

/** Resolves the base permission level for a role on a feature (defaults to "none"). */
export function resolvePermission(
  role: AdminRoleKey,
  feature: PermissionFeature,
): PermissionLevel {
  return PERMISSION_MATRIX[feature]?.[role] ?? "none";
}

/** Resolves every feature's permission for a role, applying overrides when present. */
export function resolvePermissions(
  role: AdminRoleKey,
  overrides?: PermissionOverrides,
): Record<PermissionFeature, PermissionLevel> {
  return PERMISSION_FEATURES.reduce(
    (permissions, feature) => {
      permissions[feature.key] =
        overrides?.[feature.key] ?? resolvePermission(role, feature.key);
      return permissions;
    },
    {} as Record<PermissionFeature, PermissionLevel>,
  );
}

/** Builds 1-2 uppercase initials from a name; returns "?" when empty. */
export function initialsFromName(name: string) {
  const parts = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "?";

  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** Strips all non-digit characters from a phone value. */
export function normalizePhone(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
}

/**
 * Formats a Tanzanian phone number as "+255 XXX XXX XXX".
 *
 * Accepts values with a 255 country code or a leading 0; numbers that are not
 * 9 digits after normalization are returned with a leading "+".
 */
export function formatPhone(value: unknown) {
  const digits = normalizePhone(value);

  if (!digits) return "";

  const local = digits.startsWith("255")
    ? digits.slice(3)
    : digits.startsWith("0")
      ? digits.slice(1)
      : digits;

  if (local.length !== 9) return `+${digits}`;

  return `+255 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}

/**
 * Formats a last-login timestamp as a relative string.
 *
 * Returns "Active now" when online, "Never signed in" for missing or invalid
 * dates, then minutes/hours/days buckets, and a short UTC date beyond a week.
 */
export function formatLastLogin(value: string | null, isOnline = false) {
  if (isOnline) return "Active now";
  if (!value) return "Never signed in";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Never signed in";

  const diffMs = Date.now() - date.getTime();

  if (diffMs < 60_000) return "Just now";

  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);

  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
    timeZone: "UTC",
  });
}

// RFC 4180 CSV cell escaping: quote cells containing commas, quotes or newlines.
const csvEscape = (value: unknown) => {
  const text = value === null || value === undefined ? "" : String(value);

  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const csvRow = (...cells: unknown[]) => cells.map(csvEscape).join(",");

/** Builds a CSV string of the permission matrix (features as rows, roles as columns). */
export function buildPermissionMatrixCsv(
  matrix: Record<PermissionFeature, Record<AdminRoleKey, PermissionLevel>> = PERMISSION_MATRIX,
) {
  const header = csvRow(
    "Feature",
    ...ADMIN_ROLES.map((role) => role.label),
  );

  const rows = PERMISSION_FEATURES.map((feature) =>
    csvRow(
      feature.label,
      ...ADMIN_ROLES.map(
        (role) => PERMISSION_LEVEL_LABELS[matrix[feature.key][role.key]],
      ),
    ),
  );

  return [header, ...rows].join("\n");
}

/** Triggers a browser download of the permission matrix as a dated CSV file. */
export function downloadPermissionMatrixCsv() {
  const content = buildPermissionMatrixCsv();
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `raut-permission-matrix-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
