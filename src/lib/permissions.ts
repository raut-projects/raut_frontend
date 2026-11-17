export const PERMISSIONS = {
  ANALYTICS_EXPORT: "analytics.export",
  ANALYTICS_READ: "analytics.read",
  COMPLIANCE_TRIPS_EXPORT: "compliance.trips.export",
  COMPLIANCE_TRIPS_READ: "compliance.trips.read",
  COMPLIANCE_VEHICLES_VERIFY: "compliance.vehicles.verify",
  CUSTOMERS_DEACTIVATE: "customers.deactivate",
  CUSTOMERS_DELETE: "customers.delete",
  CUSTOMERS_READ: "customers.read",
  CUSTOMERS_UPDATE: "customers.update",
  DRIVERS_DOCUMENTS_REVIEW: "drivers.documents.review",
  DRIVERS_READ: "drivers.read",
  DRIVERS_SUSPEND: "drivers.suspend",
  DRIVERS_VERIFY: "drivers.verify",
  FINANCE_PAYOUTS_APPROVE: "finance.payouts.approve",
  FINANCE_PAYOUTS_MANAGE: "finance.payouts.manage",
  FINANCE_PAYOUTS_READ: "finance.payouts.read",
  FINANCE_REFUNDS_ISSUE: "finance.refunds.issue",
  FINANCE_TRANSACTIONS_READ: "finance.transactions.read",
  MARKETING_PROMOTIONS_MANAGE: "marketing.promotions.manage",
  MARKETING_PROMOTIONS_READ: "marketing.promotions.read",
  MARKETING_REFERRALS_MANAGE: "marketing.referrals.manage",
  MARKETING_REFERRALS_READ: "marketing.referrals.read",
  AUDIT_READ: "audit.read",
  PLATFORM_ADMINS_MANAGE: "platform.admins.manage",
  PLATFORM_ADMINS_READ: "platform.admins.read",
  PLATFORM_CONFIG_MANAGE: "platform.config.manage",
  PLATFORM_CONFIG_READ: "platform.config.read",
  PLATFORM_ROLES_MANAGE: "platform.roles.manage",
  PLATFORM_ROLES_READ: "platform.roles.read",
  RIDES_CANCEL: "rides.cancel",
  RIDES_READ: "rides.read",
  RIDES_ROUTES_MANAGE: "rides.routes.manage",
  RIDES_ROUTES_READ: "rides.routes.read",
  SUPPORT_TICKETS_ASSIGN: "support.tickets.assign",
  SUPPORT_TICKETS_MANAGE: "support.tickets.manage",
  SUPPORT_TICKETS_READ: "support.tickets.read",
  SUPPORT_TICKETS_REPLY: "support.tickets.reply",
  SUPPORT_TICKETS_RESOLVE: "support.tickets.resolve",
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const normalizePath = (value) =>
  String(value ?? "")
    .replace(/\/+$/, "") || "/";

export const hasPermission = (access, permission: string) =>
  Boolean(access && Array.isArray(access.permissions) && access.permissions.includes(permission));

export const hasAnyPermission = (access, permissions: string[]) =>
  permissions.some((permission) => hasPermission(access, permission));

export const hasAllPermissions = (access, permissions: string[]) =>
  permissions.every((permission) => hasPermission(access, permission));

type RouteRule = {
  matches: (path: string) => boolean;
  permission: PermissionCode;
};

const isExactly = (target: string) => (path: string) => path === target;
const startsWith = (prefix: string) => (path: string) => path === prefix || path.startsWith(`${prefix}/`);

const ROUTE_RULES: RouteRule[] = [
  { matches: isExactly("/marketing/promotions/new"), permission: PERMISSIONS.MARKETING_PROMOTIONS_MANAGE },
  { matches: startsWith("/marketing/promotions"), permission: PERMISSIONS.MARKETING_PROMOTIONS_READ },
  { matches: isExactly("/support-tickets/new"), permission: PERMISSIONS.SUPPORT_TICKETS_MANAGE },
  { matches: isExactly("/"), permission: PERMISSIONS.ANALYTICS_READ },
  { matches: startsWith("/live-rides"), permission: PERMISSIONS.RIDES_READ },
  { matches: startsWith("/drivers"), permission: PERMISSIONS.DRIVERS_READ },
  { matches: startsWith("/customers"), permission: PERMISSIONS.CUSTOMERS_READ },
  { matches: startsWith("/rides"), permission: PERMISSIONS.RIDES_READ },
  { matches: startsWith("/routes"), permission: PERMISSIONS.RIDES_ROUTES_READ },
  { matches: startsWith("/payouts"), permission: PERMISSIONS.FINANCE_PAYOUTS_READ },
  { matches: startsWith("/transactions"), permission: PERMISSIONS.FINANCE_TRANSACTIONS_READ },
  { matches: startsWith("/marketing/referrals"), permission: PERMISSIONS.MARKETING_REFERRALS_READ },
  { matches: startsWith("/support-tickets"), permission: PERMISSIONS.SUPPORT_TICKETS_READ },
  { matches: startsWith("/settings/platform-config"), permission: PERMISSIONS.PLATFORM_CONFIG_READ },
  { matches: startsWith("/settings/platform"), permission: PERMISSIONS.PLATFORM_CONFIG_READ },
  { matches: startsWith("/settings/admin-users"), permission: PERMISSIONS.PLATFORM_ADMINS_READ },
  { matches: startsWith("/settings/audit-logs"), permission: PERMISSIONS.AUDIT_READ },
];

export const resolveRoutePermission = (pathname): PermissionCode | null =>
  ROUTE_RULES.find((rule) => rule.matches(normalizePath(pathname)))?.permission ?? null;

const LANDING_ROUTES: PermissionCode[] = [
  PERMISSIONS.ANALYTICS_READ,
  PERMISSIONS.RIDES_READ,
  PERMISSIONS.CUSTOMERS_READ,
  PERMISSIONS.DRIVERS_READ,
  PERMISSIONS.FINANCE_PAYOUTS_READ,
  PERMISSIONS.SUPPORT_TICKETS_READ,
  PERMISSIONS.MARKETING_PROMOTIONS_READ,
  PERMISSIONS.AUDIT_READ,
];

export const firstPermittedRoute = (access): string | null => {
  const route = LANDING_ROUTES.find((permission) => hasPermission(access, permission));

  if (!route) return null;
  if (route === PERMISSIONS.RIDES_READ) return "/live-rides";
  if (route === PERMISSIONS.CUSTOMERS_READ) return "/customers";
  if (route === PERMISSIONS.DRIVERS_READ) return "/drivers";
  if (route === PERMISSIONS.FINANCE_PAYOUTS_READ) return "/payouts";
  if (route === PERMISSIONS.SUPPORT_TICKETS_READ) return "/support-tickets";
  if (route === PERMISSIONS.MARKETING_PROMOTIONS_READ) return "/marketing/promotions";
  if (route === PERMISSIONS.AUDIT_READ) return "/settings/audit-logs";
  return "/";
};
