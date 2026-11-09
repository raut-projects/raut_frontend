import { API_ROUTES } from "@/lib/config";
import {
  normalizeAdminRole,
  normalizeAdminStatus,
  normalizePhone,
  type AdminUser,
  type AdminUserInvitePayload,
  type AdminUserListParams,
  type AdminUserListResult,
  type AdminUserUpdatePayload,
  type PermissionLevel,
  type PermissionOverrides,
} from "@/lib/adminUsers";
import {
  ADMIN_USERS_USE_MOCK_DATA,
  mockDeactivateAdminUser,
  mockGetAdminUser,
  mockInviteAdminUser,
  mockListAdminUsers,
  mockReactivateAdminUser,
  mockUpdateAdminUser,
} from "@/lib/mockAdminUsers";
import { apiGet, apiPatch, apiPost, apiPut } from "./api";

export const isAdminUsersMockEnabled = ADMIN_USERS_USE_MOCK_DATA;

type RecordValue = Record<string, unknown>;

const asRecord = (value: unknown): RecordValue =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordValue)
    : {};

const firstValue = (record: RecordValue, ...keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
};

const text = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

const requiredText = (record: RecordValue, ...keys: string[]) => {
  const value = text(firstValue(record, ...keys)).trim();

  if (!value) {
    throw new Error(`The admin user response is missing ${keys[0]}.`);
  }

  return value;
};

const truthy = (value: unknown) =>
  value === true || value === 1 || value === "true" || value === "1";

const objectArray = (value: unknown): RecordValue[] =>
  Array.isArray(value) ? value.map(asRecord) : [];

const listItems = (data: unknown, ...keys: string[]) => {
  if (Array.isArray(data)) return objectArray(data);
  const record = asRecord(data);
  const items = firstValue(record, ...keys, "items", "results", "users");

  return objectArray(items);
};

const nameFrom = (value: unknown) => {
  if (typeof value === "string") return value;
  const record = asRecord(value);
  const direct = text(
    firstValue(record, "name", "full_name", "fullName", "display_name"),
  );

  if (direct) return direct;

  return [
    text(firstValue(record, "first_name", "firstName")),
    text(firstValue(record, "last_name", "lastName")),
  ]
    .filter(Boolean)
    .join(" ");
};

const normalizePermissionLevel = (value: unknown): PermissionLevel => {
  const level = text(value).toLowerCase().replace(/[-\s]/g, "_");

  if (
    level === "full" ||
    level === "all" ||
    level === "write" ||
    level === "manage"
  ) {
    return "full";
  }

  if (level === "own" || level === "own_only" || level === "self") {
    return "own";
  }

  if (
    level === "finance" ||
    level === "finance_scope" ||
    level === "finance_only"
  ) {
    return "finance";
  }

  if (
    level === "marketing" ||
    level === "marketing_scope" ||
    level === "marketing_only"
  ) {
    return "marketing";
  }

  if (
    level === "limited" ||
    level === "read" ||
    level === "read_only" ||
    level === "view"
  ) {
    return "limited";
  }

  return "none";
};

const mapPermissions = (value: unknown): PermissionOverrides | undefined => {
  const record = asRecord(value);
  const entries = Object.entries(record).filter(
    ([, level]) => level !== undefined && level !== null && level !== "",
  );

  if (!entries.length) return undefined;

  return Object.fromEntries(
    entries.map(([feature, level]) => [
      feature,
      normalizePermissionLevel(level),
    ]),
  ) as PermissionOverrides;
};

const mapAdminUser = (value: unknown, index = 0): AdminUser => {
  const record = asRecord(value);
  const user = asRecord(firstValue(record, "user", "admin"));
  const source = Object.keys(user).length ? { ...record, ...user } : record;
  const role = normalizeAdminRole(firstValue(source, "role", "role_key"));
  const lastLoginValue = firstValue(
    source,
    "last_login_at",
    "lastLoginAt",
    "last_login",
    "last_seen_at",
  );
  const lastLoginAt = text(lastLoginValue).trim() || null;
  const isOnline = truthy(
    firstValue(source, "is_online", "isOnline", "online"),
  );
  const status = normalizeAdminStatus(
    firstValue(source, "status", "account_status", "state"),
  );

  return {
    id:
      text(firstValue(source, "id", "user_id", "userId", "admin_id")) ||
      `admin-${index}`,
    name:
      nameFrom(firstValue(source, "user", "admin")) ||
      text(firstValue(source, "name", "full_name", "fullName")) ||
      "Unnamed admin",
    email: text(firstValue(source, "email", "email_address")).trim(),
    phone: normalizePhone(
      firstValue(source, "phone", "phone_number", "phoneNumber", "msisdn"),
    ),
    role,
    status,
    lastLoginAt,
    isOnline,
    twoFactorRequired: truthy(
      firstValue(
        source,
        "two_factor_required",
        "twoFactorRequired",
        "requires_2fa",
        "mfa_enabled",
      ),
    ),
    permissions: mapPermissions(
      firstValue(source, "permissions", "permission_overrides", "overrides"),
    ),
    invitedAt:
      text(firstValue(source, "invited_at", "invitedAt")).trim() || undefined,
    deactivatedAt:
      text(
        firstValue(source, "deactivated_at", "deactivatedAt", "suspended_at"),
      ).trim() || undefined,
    createdAt:
      text(firstValue(source, "created_at", "createdAt", "joined_at")).trim() ||
      new Date().toISOString(),
  };
};

export async function listAdminUsers(
  params: AdminUserListParams = {},
): Promise<AdminUserListResult> {
  if (ADMIN_USERS_USE_MOCK_DATA) return mockListAdminUsers(params);

  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const data = await apiGet(API_ROUTES.users, {
    params: {
      page,
      page_size: limit,
      search: params.search?.trim() || undefined,
      status:
        params.status && params.status !== "all" ? params.status : undefined,
    },
  });
  const record = asRecord(data);
  const items = listItems(data, "admins", "admin_users").map(mapAdminUser);
  const pagination = asRecord(
    record.pagination ?? asRecord(record.meta).pagination,
  );
  const total = Number(
    firstValue(pagination, "total_items", "total_count", "total") ??
      firstValue(record, "total", "total_count", "total_items") ??
      items.length,
  );

  return {
    items,
    total: Number.isFinite(total) ? total : items.length,
    page,
    limit,
  };
}

export async function getAdminUser(userId: string): Promise<AdminUser> {
  if (ADMIN_USERS_USE_MOCK_DATA) return mockGetAdminUser(userId);

  const data = await apiGet(
    `${API_ROUTES.users}/${encodeURIComponent(userId)}`,
  );

  return mapAdminUser(data);
}

export async function inviteAdminUser(
  payload: AdminUserInvitePayload,
): Promise<AdminUser> {
  if (ADMIN_USERS_USE_MOCK_DATA) return mockInviteAdminUser(payload);

  const data = await apiPost(API_ROUTES.adminUserInvite, payload);

  return mapAdminUser(data);
}

export async function updateAdminUser(
  userId: string,
  payload: AdminUserUpdatePayload,
): Promise<AdminUser> {
  if (ADMIN_USERS_USE_MOCK_DATA) return mockUpdateAdminUser(userId, payload);

  const data = await apiPatch(API_ROUTES.adminUser(userId), payload);

  return mapAdminUser(data);
}

export async function deactivateAdminUser(
  userId: string,
  reason?: string,
): Promise<AdminUser> {
  if (ADMIN_USERS_USE_MOCK_DATA) return mockDeactivateAdminUser(userId);

  const data = await apiPut(
    `${API_ROUTES.users}/${encodeURIComponent(userId)}/deactivate`,
    reason ? { reason } : {},
  );

  return mapAdminUser(data);
}

export async function reactivateAdminUser(
  userId: string,
): Promise<AdminUser> {
  if (ADMIN_USERS_USE_MOCK_DATA) return mockReactivateAdminUser(userId);

  const data = await apiPut(
    `${API_ROUTES.users}/${encodeURIComponent(userId)}/reactivate`,
    {},
  );

  return mapAdminUser(data);
}
