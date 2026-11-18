// Illustrative mock admin-user data. NOT a backend contract: used for demo and
// local development only.

import type {
  AdminUser,
  AdminUserInvitePayload,
  AdminUserListParams,
  AdminUserListResult,
  AdminUserUpdatePayload,
  PermissionOverrides,
} from "@/lib/adminUsers";

const MOCK_DELAY_MS = 160;

export const ADMIN_USERS_USE_MOCK_DATA =
  process.env.NEXT_PUBLIC_USE_MOCK_ADMIN_USERS !== "false";

const wait = (duration = MOCK_DELAY_MS) =>
  new Promise<void>((resolve) => setTimeout(resolve, duration));

const daysFromNow = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60_000).toISOString();

const MOCK_ADMIN_USERS: AdminUser[] = [
  {
    id: "A001",
    name: "Collin Mwakalinga",
    email: "collin@raut.co.tz",
    phone: "712345678",
    role: "super_admin",
    status: "active",
    lastLoginAt: minutesAgo(2),
    isOnline: true,
    twoFactorRequired: true,
    createdAt: daysFromNow(-420),
  },
  {
    id: "A002",
    name: "Sarah Wanjiru",
    email: "sarah@raut.co.tz",
    phone: "689123456",
    role: "support_agent",
    status: "active",
    lastLoginAt: minutesAgo(15),
    isOnline: true,
    twoFactorRequired: true,
    createdAt: daysFromNow(-260),
  },
  {
    id: "A003",
    name: "Joseph Mwakalinga",
    email: "joseph@raut.co.tz",
    phone: "754987654",
    role: "operations_agent",
    status: "active",
    lastLoginAt: minutesAgo(95),
    isOnline: false,
    twoFactorRequired: false,
    createdAt: daysFromNow(-210),
  },
  {
    id: "A004",
    name: "Neema Mushi",
    email: "neema@raut.co.tz",
    phone: "789123456",
    role: "finance_manager",
    status: "active",
    lastLoginAt: minutesAgo(240),
    isOnline: false,
    twoFactorRequired: true,
    createdAt: daysFromNow(-180),
  },
  {
    id: "A005",
    name: "Asha Salum",
    email: "asha@raut.co.tz",
    phone: "715222333",
    role: "marketing_manager",
    status: "active",
    lastLoginAt: minutesAgo(60 * 27),
    isOnline: false,
    twoFactorRequired: true,
    createdAt: daysFromNow(-150),
  },
  {
    id: "A006",
    name: "Frank Msigwa",
    email: "frank@raut.co.tz",
    phone: "768444555",
    role: "analyst",
    status: "active",
    lastLoginAt: minutesAgo(60 * 52),
    isOnline: false,
    twoFactorRequired: false,
    permissions: { promotions: "full" },
    createdAt: daysFromNow(-120),
  },
  {
    id: "A007",
    name: "Zawadi Peter",
    email: "zawadi@raut.co.tz",
    phone: "745666777",
    role: "marketing_agent",
    status: "invited",
    lastLoginAt: null,
    isOnline: false,
    twoFactorRequired: true,
    invitedAt: daysFromNow(-2),
    createdAt: daysFromNow(-2),
  },
  {
    id: "A008",
    name: "Halima Said",
    email: "halima@raut.co.tz",
    phone: "713888999",
    role: "finance_agent",
    status: "deactivated",
    lastLoginAt: minutesAgo(60 * 24 * 34),
    isOnline: false,
    twoFactorRequired: true,
    deactivatedAt: daysFromNow(-12),
    createdAt: daysFromNow(-300),
  },
  {
    id: "A009",
    name: "Grace Kessy",
    email: "grace@raut.co.tz",
    phone: "782111222",
    role: "platform_manager",
    status: "active",
    lastLoginAt: minutesAgo(60 * 5),
    isOnline: false,
    twoFactorRequired: true,
    createdAt: daysFromNow(-90),
  },
];

let adminUsers: AdminUser[] = MOCK_ADMIN_USERS.map((user) => ({ ...user }));

const matchesSearch = (user: AdminUser, search: string) => {
  if (!search) return true;

  const needle = search.trim().toLowerCase();
  const phone = user.phone.replace(/\D/g, "");
  const digits = needle.replace(/\D/g, "");

  return (
    user.name.toLowerCase().includes(needle) ||
    user.email.toLowerCase().includes(needle) ||
    user.id.toLowerCase().includes(needle) ||
    (digits.length > 0 && phone.includes(digits))
  );
};

const nextId = () => {
  const highest = adminUsers.reduce((max, user) => {
    const numeric = Number(user.id.replace(/\D/g, ""));

    return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
  }, 0);

  return `A${String(highest + 1).padStart(3, "0")}`;
};

export async function mockListAdminUsers(
  params: AdminUserListParams = {},
): Promise<AdminUserListResult> {
  await wait();

  const page = Math.max(1, params.page ?? 1);
  const limit = Math.max(1, params.limit ?? 20);
  const status = params.status ?? "all";
  const search = params.search?.trim() ?? "";

  const filtered = adminUsers.filter((user) => {
    if (status !== "all" && user.status !== status) return false;

    return matchesSearch(user, search);
  });

  const start = (page - 1) * limit;

  return {
    items: filtered.slice(start, start + limit).map((user) => ({ ...user })),
    total: filtered.length,
    page,
    limit,
  };
}

export async function mockGetAdminUser(id: string): Promise<AdminUser> {
  await wait();

  const user = adminUsers.find((entry) => entry.id === id);

  if (!user) {
    throw new Error("That admin user could not be found.");
  }

  return { ...user };
}

export async function mockInviteAdminUser(
  payload: AdminUserInvitePayload,
): Promise<AdminUser> {
  await wait();

  const user: AdminUser = {
    id: nextId(),
    name: payload.name.trim(),
    email: payload.email.trim(),
    phone: payload.phone.trim(),
    role: payload.role,
    status: "invited",
    lastLoginAt: null,
    isOnline: false,
    twoFactorRequired: payload.two_factor_required,
    permissions: sanitizePermissions(payload.permissions),
    invitedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  adminUsers = [user, ...adminUsers];

  return { ...user };
}

export async function mockUpdateAdminUser(
  id: string,
  payload: AdminUserUpdatePayload,
): Promise<AdminUser> {
  await wait();

  const index = adminUsers.findIndex((entry) => entry.id === id);

  if (index < 0) {
    throw new Error("That admin user could not be found.");
  }

  adminUsers[index] = {
    ...adminUsers[index],
    role: payload.role,
    twoFactorRequired: payload.two_factor_required,
    permissions: sanitizePermissions(payload.permissions),
    status:
      adminUsers[index].status === "invited"
        ? "invited"
        : adminUsers[index].status,
  };

  return { ...adminUsers[index] };
}

export async function mockDeactivateAdminUser(id: string): Promise<AdminUser> {
  await wait();

  const index = adminUsers.findIndex((entry) => entry.id === id);

  if (index < 0) {
    throw new Error("That admin user could not be found.");
  }

  adminUsers[index] = {
    ...adminUsers[index],
    status: "deactivated",
    isOnline: false,
    deactivatedAt: new Date().toISOString(),
  };

  return { ...adminUsers[index] };
}

export async function mockReactivateAdminUser(id: string): Promise<AdminUser> {
  await wait();

  const index = adminUsers.findIndex((entry) => entry.id === id);

  if (index < 0) {
    throw new Error("That admin user could not be found.");
  }

  adminUsers[index] = {
    ...adminUsers[index],
    status: "active",
    deactivatedAt: undefined,
  };

  return { ...adminUsers[index] };
}

function sanitizePermissions(permissions?: PermissionOverrides) {
  if (!permissions) return undefined;

  const entries = Object.entries(permissions).filter(
    ([, level]) =>
      level === "full" ||
      level === "limited" ||
      level === "none" ||
      level === "own" ||
      level === "finance" ||
      level === "marketing",
  );

  return entries.length
    ? (Object.fromEntries(entries) as PermissionOverrides)
    : undefined;
}
