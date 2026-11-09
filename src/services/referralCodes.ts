import { API_ROUTES } from "@/lib/config";
import {
  normalizeReferralRewardType,
  normalizeReferralStatus,
  normalizeReferralUserType,
  referralStoredStatus,
  type ReferralAssignableUser,
  type ReferralCode,
  type ReferralCodeListParams,
  type ReferralCodeListResult,
  type ReferralCodePayload,
  type ReferralCodeStats,
  type ReferralCodeUpdatePayload,
  type ReferralSendChannel,
  type ReferralUserType,
} from "@/lib/referralCodes";
import {
  MARKETING_USES_MOCK_DATA,
  mockCreateReferralCode,
  mockDeleteReferralCode,
  mockGetReferralCodeStats,
  mockListReferralCodes,
  mockSearchReferralUsers,
  mockSendReferralCode,
  mockUpdateReferralCode,
} from "@/lib/mockReferralCodes";
import { apiDelete, apiGet, apiPatch, apiPost } from "./api";

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

const number = (value: unknown, fallback = 0) => {
  const amount = Number(value);

  return Number.isFinite(amount) ? amount : fallback;
};

const optionalNumber = (value: unknown) => {
  if (value === undefined || value === null || value === "") return undefined;

  const amount = Number(value);

  return Number.isFinite(amount) ? amount : undefined;
};

const objectArray = (value: unknown): RecordValue[] =>
  Array.isArray(value) ? value.map(asRecord) : [];

const listItems = (data: unknown, ...keys: string[]) => {
  if (Array.isArray(data)) return objectArray(data);
  const record = asRecord(data);
  const items = firstValue(record, ...keys, "items", "results");

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

const normalizePaginationTotal = (
  record: RecordValue,
  items: RecordValue[],
) => {
  const pagination = asRecord(
    record.pagination ?? asRecord(record.meta).pagination,
  );
  const total = Number(
    firstValue(pagination, "total_items", "total_count", "total") ??
      firstValue(record, "total", "total_count", "total_items") ??
      items.length,
  );

  return Number.isFinite(total) ? total : items.length;
};

function mapReferralCode(
  value: unknown,
  fallbackId = "referral-code",
): ReferralCode {
  const record = asRecord(value);
  const assignedValue = firstValue(
    record,
    "assigned_user",
    "assignedUser",
    "assigned_to",
    "assignedTo",
    "user",
    "rider",
    "driver",
  );
  const assigned = asRecord(assignedValue);
  const id =
    text(
      firstValue(
        record,
        "id",
        "referral_code_id",
        "referralCodeId",
        "reference",
      ),
    ) || fallbackId;
  const code =
    text(
      firstValue(
        record,
        "code",
        "referral_code",
        "referralCode",
        "promo_code",
        "promoCode",
      ),
    ) || id;
  const uses = number(
    firstValue(
      record,
      "uses",
      "usage_count",
      "usageCount",
      "completed_referrals",
      "completedReferrals",
      "successful_referrals",
      "successfulReferrals",
      "referrals",
    ),
  );
  const referrerRewardTzs = number(
    firstValue(
      record,
      "referrer_reward_tzs",
      "referrerRewardTzs",
      "referrer_reward",
      "referrerReward",
    ),
  );
  const pendingReferrals = number(
    firstValue(
      record,
      "pending_referrals",
      "pendingReferrals",
      "pending_count",
      "pendingCount",
      "in_progress_referrals",
      "inProgressReferrals",
    ),
  );
  const rewardsRecorded = optionalNumber(
    firstValue(
      record,
      "rewards_tzs",
      "rewardsTzs",
      "rewards_paid_tzs",
      "rewardsPaidTzs",
      "paid_rewards_tzs",
      "paidRewardsTzs",
    ),
  );
  const expiryDate = text(
    firstValue(
      record,
      "expiry_date",
      "expiryDate",
      "expires_at",
      "expiresAt",
      "expires_on",
      "expiresOn",
      "expiry",
    ),
  );
  const startDate = text(
    firstValue(
      record,
      "start_date",
      "startDate",
      "starts_at",
      "startsAt",
      "valid_from",
      "validFrom",
    ),
  );

  return {
    id,
    name:
      text(
        firstValue(
          record,
          "name",
          "referral_name",
          "referralName",
          "title",
          "label",
        ),
      ) || code,
    code,
    assignedUserId: text(
      firstValue(assigned, "id", "user_id", "userId") ??
        firstValue(
          record,
          "assigned_user_id",
          "assignedUserId",
          "assigned_to_id",
          "assignedToId",
          "user_id",
          "userId",
        ),
    ),
    assignedUserName:
      nameFrom(assignedValue) ||
      text(
        firstValue(
          record,
          "assigned_user_name",
          "assignedUserName",
          "assigned_to_name",
          "assignedToName",
          "user_name",
          "userName",
        ),
      ) ||
      "Unknown user",
    assignedUserEmail:
      text(
        firstValue(assigned, "email") ??
          firstValue(record, "assigned_user_email", "user_email"),
      ) || undefined,
    assignedUserPhone:
      text(
        firstValue(assigned, "phone", "phone_number", "phoneNumber") ??
          firstValue(record, "assigned_user_phone", "user_phone"),
      ) || undefined,
    userType: normalizeReferralUserType(
      firstValue(assigned, "user_type", "type", "role", "is_driver") ??
        firstValue(
          record,
          "user_type",
          "userType",
          "assigned_user_type",
          "assignedUserType",
          "type",
          "role",
        ),
      "rider",
    ),
    uses,
    pendingReferrals,
    maxUses: number(
      firstValue(
        record,
        "max_uses",
        "maxUses",
        "usage_limit",
        "usageLimit",
        "total_uses_limit",
      ),
      20,
    ),
    referrerRewardTzs,
    newUserRewardTzs: number(
      firstValue(
        record,
        "new_user_reward_tzs",
        "newUserRewardTzs",
        "referee_reward_tzs",
        "refereeRewardTzs",
        "new_user_reward",
      ),
    ),
    rewardType: normalizeReferralRewardType(
      firstValue(record, "reward_type", "rewardType", "type"),
    ),
    rewardsTzs:
      rewardsRecorded !== undefined
        ? rewardsRecorded
        : uses * referrerRewardTzs,
    status: normalizeReferralStatus(
      firstValue(record, "status", "state", "code_status", "codeStatus"),
      expiryDate,
      pendingReferrals,
    ),
    startDate,
    expiryDate,
    createdAt: text(
      firstValue(record, "created_at", "createdAt", "date", "created_on"),
    ),
  };
}

function mapReferralStats(value: unknown): ReferralCodeStats {
  const record = asRecord(value);
  const stats = asRecord(firstValue(record, "stats", "statistics") ?? record);

  return {
    totalCodes: number(
      firstValue(
        stats,
        "total_codes",
        "totalCodes",
        "total",
        "codes_total",
        "codesTotal",
      ),
    ),
    assigned: number(
      firstValue(
        stats,
        "assigned",
        "assigned_codes",
        "assignedCodes",
        "assigned_users",
        "assignedUsers",
      ),
    ),
    successfulReferrals: number(
      firstValue(
        stats,
        "successful_referrals",
        "successfulReferrals",
        "successful",
        "completed_referrals",
        "completedReferrals",
      ),
    ),
    rewardsPaidTzs: number(
      firstValue(
        stats,
        "rewards_paid_tzs",
        "rewardsPaidTzs",
        "rewards_paid",
        "rewardsPaid",
        "rewards_tzs",
        "rewardsTzs",
      ),
    ),
  };
}

function mapReferralUser(
  value: unknown,
  fallbackUserType: ReferralUserType,
): ReferralAssignableUser {
  const record = asRecord(value);
  const driverFlag = firstValue(record, "is_driver", "isDriver");
  const userType =
    driverFlag !== undefined
      ? normalizeReferralUserType(driverFlag, fallbackUserType)
      : normalizeReferralUserType(
          firstValue(record, "user_type", "userType", "type", "role"),
          fallbackUserType,
        );

  return {
    id: text(firstValue(record, "id", "user_id", "userId")),
    name:
      nameFrom(record) ||
      text(firstValue(record, "name", "email")) ||
      "Unknown user",
    email: text(firstValue(record, "email")) || undefined,
    phone:
      text(
        firstValue(
          record,
          "phone",
          "phone_number",
          "phoneNumber",
          "mobile",
          "msisdn",
        ),
      ) || undefined,
    userType,
  };
}

export async function listReferralCodes(
  params: ReferralCodeListParams = {},
): Promise<ReferralCodeListResult> {
  if (MARKETING_USES_MOCK_DATA) return mockListReferralCodes(params);

  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const data = await apiGet(API_ROUTES.marketingReferralCodes, {
    params: {
      page,
      page_size: limit,
      search: params.search?.trim() || undefined,
      status:
        params.status && params.status !== "all" ? params.status : undefined,
      user_type: params.type && params.type !== "all" ? params.type : undefined,
      from: params.from || undefined,
      to: params.to || undefined,
    },
  });
  const record = asRecord(data);
  const rawItems = listItems(data, "referral_codes", "codes", "referrals");
  const items = rawItems.map((item, index) =>
    mapReferralCode(item, `referral-code-${(page - 1) * limit + index + 1}`),
  );

  return {
    items,
    total: normalizePaginationTotal(record, rawItems),
    page,
    limit,
  };
}

export async function getReferralCodeStats(): Promise<ReferralCodeStats> {
  if (MARKETING_USES_MOCK_DATA) return mockGetReferralCodeStats();

  const data = await apiGet(API_ROUTES.marketingReferralCodeStats);

  return mapReferralStats(data);
}

export async function createReferralCode(
  payload: ReferralCodePayload,
): Promise<ReferralCode> {
  if (MARKETING_USES_MOCK_DATA) return mockCreateReferralCode(payload);

  const data = await apiPost(API_ROUTES.marketingReferralCodes, payload);
  const record = asRecord(data);
  const createdValue =
    firstValue(
      record,
      "referral_code",
      "referralCode",
      "code_data",
      "codeData",
      "referral",
    ) ?? data;
  const createdRecord = asRecord(createdValue);
  const merged = {
    ...payload,
    ...createdRecord,
    code:
      text(
        firstValue(createdRecord, "code", "referral_code", "referralCode"),
      ) || payload.code,
    name:
      text(
        firstValue(createdRecord, "name", "referral_name", "referralName"),
      ) || payload.name,
    assigned_user_id:
      text(
        firstValue(
          createdRecord,
          "assigned_user_id",
          "assignedUserId",
          "user_id",
          "userId",
        ),
      ) || payload.assigned_user_id,
    expiry_date:
      text(
        firstValue(
          createdRecord,
          "expiry_date",
          "expiryDate",
          "expires_at",
          "expiresAt",
        ),
      ) || payload.expiry_date,
    start_date:
      text(
        firstValue(
          createdRecord,
          "start_date",
          "startDate",
          "starts_at",
          "startsAt",
        ),
      ) || payload.start_date,
    status: firstValue(createdRecord, "status", "state") ?? payload.status,
  };

  return mapReferralCode(merged, `referral-code-${payload.code}`);
}

export async function updateReferralCode(
  code: ReferralCode,
  payload: ReferralCodeUpdatePayload,
): Promise<ReferralCode> {
  if (MARKETING_USES_MOCK_DATA) {
    return mockUpdateReferralCode(code.id, payload);
  }

  const data = await apiPatch(API_ROUTES.marketingReferralCode(code.id), payload);
  const record = asRecord(data);
  const updatedValue = firstValue(
    record,
    "referral_code",
    "referralCode",
    "code_data",
    "codeData",
    "referral",
  );
  const updated = asRecord(updatedValue ?? data);
  const expiryDate =
    text(
      firstValue(
        updated,
        "expiry_date",
        "expiryDate",
        "expires_at",
        "expiresAt",
        "expires_on",
        "expiresOn",
      ),
    ) ||
    payload.expiry_date ||
    code.expiryDate;
  const maxUses = optionalNumber(
    firstValue(updated, "max_uses", "maxUses", "usage_limit", "usageLimit"),
  );
  const assignedUser = {
    id: code.assignedUserId,
    name: code.assignedUserName,
    email: code.assignedUserEmail,
    phone: code.assignedUserPhone,
    user_type: code.userType,
    ...asRecord(
      firstValue(
        updated,
        "assigned_user",
        "assignedUser",
        "assigned_to",
        "assignedTo",
        "user",
      ),
    ),
  };

  return mapReferralCode(
    {
      ...code,
      ...updated,
      assigned_user: assignedUser,
      expiry_date: expiryDate,
      max_uses: maxUses ?? payload.max_uses ?? code.maxUses,
      status:
        firstValue(updated, "status", "state", "code_status", "codeStatus") ??
        payload.status ??
        referralStoredStatus(code),
    },
    code.id,
  );
}

export async function deleteReferralCode(codeId: string): Promise<void> {
  if (MARKETING_USES_MOCK_DATA) return mockDeleteReferralCode(codeId);

  await apiDelete(API_ROUTES.marketingReferralCode(codeId));
}

export async function sendReferralCode(
  codeId: string,
  channel: ReferralSendChannel,
): Promise<void> {
  if (MARKETING_USES_MOCK_DATA) {
    return mockSendReferralCode(codeId, channel);
  }

  await apiPost(API_ROUTES.marketingReferralCodeSend(codeId), { channel });
}

export async function searchReferralUsers({
  search,
  userType,
  limit = 8,
}: {
  search: string;
  userType: ReferralUserType;
  limit?: number;
}): Promise<ReferralAssignableUser[]> {
  const query = search.trim();

  if (query.length < 2) return [];

  if (MARKETING_USES_MOCK_DATA) {
    return mockSearchReferralUsers({ search: query, userType, limit });
  }

  const data = await apiGet(API_ROUTES.users, {
    params: {
      page: 1,
      page_size: limit,
      search: query,
      is_driver: userType === "driver",
      sort_by: "created_at",
      sort_order: "desc",
    },
  });
  const rawUsers = listItems(data, "users");

  return rawUsers
    .map((user) => mapReferralUser(user, userType))
    .filter((user) => user.id && user.name)
    .slice(0, limit);
}
