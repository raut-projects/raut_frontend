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
