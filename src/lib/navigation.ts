import { PERMISSIONS, hasPermission, normalizePath, type PermissionCode } from "@/lib/permissions";

export type NavIconName =
  | "dashboard"
  | "liveRides"
  | "drivers"
  | "customers"
  | "rides"
  | "routes"
  | "payouts"
  | "transactions"
  | "promotions"
  | "referrals"
  | "support"
  | "analytics";

export type NavItem = {
  title: string;
  url: string;
  icon: NavIconName;
  badge?: string;
  activeOn?: string;
  exact?: boolean;
  permission?: string;
};

export type NavGroup = {
  label?: string;
  items: NavItem[];
};

const isExactly = (target: string) => (path: string) => path === target;
const startsWith = (prefix: string) => (path: string) =>
  path === prefix || path.startsWith(`${prefix}/`);

export const ROUTE_RULES: { matches: (path: string) => boolean; permission: PermissionCode }[] = [
  {
    matches: isExactly("/marketing/promotions/new"),
    permission: PERMISSIONS.MARKETING_PROMOTIONS_MANAGE,
  },
  {
    matches: startsWith("/marketing/promotions"),
    permission: PERMISSIONS.MARKETING_PROMOTIONS_READ,
  },
  {
    matches: isExactly("/support-tickets/new"),
    permission: PERMISSIONS.SUPPORT_TICKETS_MANAGE,
  },
  { matches: isExactly("/"), permission: PERMISSIONS.ANALYTICS_READ },
  { matches: startsWith("/live-rides"), permission: PERMISSIONS.RIDES_READ },
  { matches: startsWith("/drivers"), permission: PERMISSIONS.DRIVERS_READ },
  { matches: startsWith("/customers"), permission: PERMISSIONS.CUSTOMERS_READ },
  { matches: startsWith("/rides"), permission: PERMISSIONS.RIDES_READ },
  { matches: startsWith("/routes"), permission: PERMISSIONS.RIDES_ROUTES_READ },
  { matches: startsWith("/payouts"), permission: PERMISSIONS.FINANCE_PAYOUTS_READ },
  {
    matches: startsWith("/transactions"),
    permission: PERMISSIONS.FINANCE_TRANSACTIONS_READ,
  },
  {
    matches: startsWith("/marketing/referrals"),
    permission: PERMISSIONS.MARKETING_REFERRALS_READ,
  },
  {
    matches: startsWith("/support-tickets"),
    permission: PERMISSIONS.SUPPORT_TICKETS_READ,
  },
  {
    matches: startsWith("/settings/platform-config"),
    permission: PERMISSIONS.PLATFORM_CONFIG_READ,
  },
  {
    matches: startsWith("/settings/platform"),
    permission: PERMISSIONS.PLATFORM_CONFIG_READ,
  },
  {
    matches: startsWith("/settings/admin-users"),
    permission: PERMISSIONS.PLATFORM_ADMINS_READ,
  },
  {
    matches: startsWith("/settings/audit-logs"),
    permission: PERMISSIONS.AUDIT_READ,
  },
];

export const LANDING_ROUTES: { permission: PermissionCode; path: string }[] = [
  { permission: PERMISSIONS.ANALYTICS_READ, path: "/" },
  { permission: PERMISSIONS.RIDES_READ, path: "/live-rides" },
  { permission: PERMISSIONS.CUSTOMERS_READ, path: "/customers" },
  { permission: PERMISSIONS.DRIVERS_READ, path: "/drivers" },
  { permission: PERMISSIONS.FINANCE_PAYOUTS_READ, path: "/payouts" },
  { permission: PERMISSIONS.SUPPORT_TICKETS_READ, path: "/support-tickets" },
  {
    permission: PERMISSIONS.MARKETING_PROMOTIONS_READ,
    path: "/marketing/promotions",
  },
  { permission: PERMISSIONS.AUDIT_READ, path: "/settings/audit-logs" },
];

export const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: "dashboard",
        permission: PERMISSIONS.ANALYTICS_READ,
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        title: "Live Rides",
        url: "/live-rides",
        icon: "liveRides",
        permission: PERMISSIONS.RIDES_READ,
      },
      {
        title: "Drivers",
        url: "/drivers",
        icon: "drivers",
        permission: PERMISSIONS.DRIVERS_READ,
      },
      {
        title: "Customers",
        url: "/customers",
        icon: "customers",
        permission: PERMISSIONS.CUSTOMERS_READ,
      },
      {
        title: "Rides",
        url: "/rides",
        icon: "rides",
        permission: PERMISSIONS.RIDES_READ,
      },
      {
        title: "Routes",
        url: "/routes",
        icon: "routes",
        badge: "DUO",
        permission: PERMISSIONS.RIDES_ROUTES_READ,
      },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        title: "Payouts",
        url: "/payouts",
        icon: "payouts",
        permission: PERMISSIONS.FINANCE_PAYOUTS_READ,
      },
      {
        title: "Transactions",
        url: "/transactions",
        icon: "transactions",
        permission: PERMISSIONS.FINANCE_TRANSACTIONS_READ,
      },
    ],
  },
  {
    label: "Marketing",
    items: [
      {
        title: "Promotions",
        url: "/marketing/promotions",
        icon: "promotions",
        exact: true,
        permission: PERMISSIONS.MARKETING_PROMOTIONS_READ,
      },
      {
        title: "Referrals",
        url: "/marketing/referrals",
        icon: "referrals",
        permission: PERMISSIONS.MARKETING_REFERRALS_READ,
      },
    ],
  },
  {
    label: "Support",
    items: [
      {
        title: "Support Tickets",
        url: "/support-tickets",
        icon: "support",
        permission: PERMISSIONS.SUPPORT_TICKETS_READ,
      },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        title: "Analytics",
        url: "/",
        icon: "analytics",
        activeOn: "/analytics",
        permission: PERMISSIONS.ANALYTICS_READ,
      },
    ],
  },
];

export const SETTINGS_ITEMS: NavItem[] = [
  {
    title: "Platform Config",
    url: "/settings/platform-config",
    icon: "dashboard",
    permission: PERMISSIONS.PLATFORM_CONFIG_READ,
  },
  {
    title: "Admin Users",
    url: "/settings/admin-users",
    icon: "customers",
    permission: PERMISSIONS.PLATFORM_ADMINS_READ,
  },
  {
    title: "Audit Logs",
    url: "/settings/audit-logs",
    icon: "analytics",
    permission: PERMISSIONS.AUDIT_READ,
  },
  { title: "System Health", url: "/settings/system-health", icon: "dashboard" },
];

export const resolveRoutePermission = (pathname: string): PermissionCode | null =>
  ROUTE_RULES.find((rule) => rule.matches(normalizePath(pathname)))?.permission ??
  null;

export const firstPermittedRoute = (access: unknown): string | null =>
  LANDING_ROUTES.find((route) => hasPermission(access, route.permission))?.path ??
  null;
