import { API_ROUTES } from "@/lib/config";
import type {
  DiscountType,
  Promotion,
  PromotionListParams,
  PromotionListResult,
  PromotionPayload,
  PromotionStatus,
  Referral,
  ReferralConfig,
  ReferralConfigFormValues,
  ReferralLeader,
  ReferralListParams,
  ReferralListResult,
  ReferralOverview,
  ReferralStats,
} from "@/lib/marketing";
import {
  MARKETING_USES_MOCK_DATA,
  mockCreatePromotion,
  mockDeletePromotion,
  mockGetPromotion,
  mockGetReferralOverview,
  mockListPromotions,
  mockListReferrals,
  mockUpdatePromotion,
  mockUpdateReferralConfig,
} from "@/lib/mockMarketing";
import { apiDelete, apiGet, apiPatch, apiPost } from "./api";

export const isMarketingMockEnabled = MARKETING_USES_MOCK_DATA;

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
    throw new Error(`The marketing response is missing ${keys[0]}.`);
  }

  return value;
};

const number = (value: unknown, fallback = 0) => {
  const amount = Number(value);

  return Number.isFinite(amount) ? amount : fallback;
};

const optionalNumber = (value: unknown) => {
  if (value === undefined || value === null || value === "") return undefined;

  const amount = Number(value);

  return Number.isFinite(amount) ? amount : undefined;
};

const truthy = (value: unknown) =>
  value === true || value === 1 || value === "true" || value === "1";

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

const normalizeDiscountType = (value: unknown): DiscountType => {
  const type = text(value).toLowerCase().replace(/[-\s]/g, "_");

  if (type === "percentage" || type === "percent" || type === "percentage_off") {
    return "percentage";
  }
  if (type === "free_ride" || type === "free" || type === "free_ride_value") {
    return "free_ride";
  }

  return "fixed";
};

const normalizeStatus = (
  value: unknown,
  startsAt: string,
  endsAt: string,
): PromotionStatus => {
  const status = text(value).toLowerCase().replace(/[-\s]/g, "_");

  if (status === "draft") return "draft";
  if (status === "scheduled" || status === "upcoming" || status === "pending") {
    return "scheduled";
  }
  if (status === "expired" || status === "ended" || status === "inactive") {
    return "expired";
  }
  if (status === "active" || status === "live" || status === "running") {
    return "active";
  }

  const now = Date.now();
  const start = Date.parse(startsAt);
  const end = Date.parse(endsAt);

  if (Number.isFinite(end) && end < now) return "expired";
  if (Number.isFinite(start) && start > now) return "scheduled";

  return "active";
};

const normalizeUserType = (
  value: unknown,
): ReferralLeader["userType"] => {
  const type = text(value).toLowerCase();

  if (type === "driver") return "driver";
  if (type === "rider" || type === "customer" || type === "passenger") {
    return "rider";
  }

  return "other";
};

export function mapPromotion(value: unknown): Promotion {
  const record = asRecord(value);
  const eligibility = asRecord(firstValue(record, "eligibility"));
  const startsAt = text(
    firstValue(record, "starts_at", "startsAt", "start_date", "startDate", "start"),
  );
  const endsAt = text(
    firstValue(record, "ends_at", "endsAt", "end_date", "endDate", "end"),
  );
  const discountType = normalizeDiscountType(
    firstValue(record, "discount_type", "discountType", "type"),
  );
  const discountValue = number(
    firstValue(
      record,
      "discount_value",
      "discountValue",
      "discount_percent",
      "discountPercent",
      "value",
    ),
  );
  const phoneList =
    firstValue(eligibility, "phones") ??
    firstValue(record, "eligible_phones", "eligiblePhones", "user_list", "userList");
  const eligiblePhones = Array.isArray(phoneList)
    ? phoneList.map((phone) => text(phone)).filter(Boolean)
    : [];

  const usageCount = number(
    firstValue(record, "usage_count", "usageCount", "used_count", "usedCount", "redemptions"),
  );
  const recordedBudget = number(
    firstValue(
      record,
      "budget_used_tzs",
      "budgetUsedTzs",
      "discount_given_tzs",
      "discountGivenTzs",
      "spent_tzs",
      "spentTzs",
    ),
  );
  const budgetUsedTzs =
    recordedBudget > 0
      ? recordedBudget
      : discountType === "fixed"
        ? usageCount * discountValue
        : 0;

  return {
    id: requiredText(record, "id", "promotion_id", "promotionId", "reference"),
    code:
      text(firstValue(record, "code", "promo_code", "promoCode")) ||
      text(firstValue(record, "id", "promotion_id", "reference")),
    name:
      text(firstValue(record, "name", "title", "campaign_name")) ||
      text(firstValue(record, "code", "promo_code")),
    description: text(firstValue(record, "description", "details", "summary")),
    discountType,
    discountValue,
    maxDiscountTzs: optionalNumber(
      firstValue(record, "max_discount_tzs", "maxDiscountTzs", "max_discount", "maxDiscount"),
    ),
    maxRideValueTzs: optionalNumber(
      firstValue(record, "max_ride_value_tzs", "maxRideValueTzs", "max_ride_value", "maxRideValue"),
    ),
    newUsersOnly: truthy(
      firstValue(eligibility, "new_users", "newUsers") ??
        firstValue(record, "new_users_only", "newUsersOnly", "new_users"),
    ),
    existingUsersOnly: truthy(
      firstValue(eligibility, "existing_users", "existingUsers") ??
        firstValue(record, "existing_users_only", "existingUsersOnly", "existing_users"),
    ),
    eligiblePhones: eligiblePhones.length ? eligiblePhones : undefined,
    startsAt,
    endsAt,
    perUserLimit: number(
      firstValue(record, "per_user_limit", "perUserLimit", "per_user", "perUser"),
      1,
    ),
    totalUsesLimit: optionalNumber(
      firstValue(record, "total_uses_limit", "totalUsesLimit", "total_uses", "totalUses"),
    ),
    budgetCapTzs: number(
      firstValue(record, "budget_cap_tzs", "budgetCapTzs", "budget_cap", "budgetCap"),
    ),
    budgetUsedTzs,
    usageCount,
    peakHoursOnly: truthy(
      firstValue(record, "peak_hours_only", "peakHoursOnly", "peak_hours", "peakHours"),
    ),
    peakHoursLabel:
      text(firstValue(record, "peak_hours_label", "peakHoursLabel", "peak_hours")) ||
      undefined,
    minimumRideTzs: optionalNumber(
      firstValue(record, "minimum_ride_tzs", "minimumRideTzs", "min_ride_tzs", "minRideTzs"),
    ),
    duoOnly: truthy(
      firstValue(record, "duo_only", "duoOnly", "duo", "apply_to_duo"),
    ),
    notifySms: truthy(
      firstValue(record, "notify_sms", "notifySms", "send_sms", "sendSms"),
    ),
    inAppBanner: truthy(
      firstValue(record, "in_app_banner", "inAppBanner", "show_banner", "showBanner"),
    ),
    status: normalizeStatus(firstValue(record, "status", "state"), startsAt, endsAt),
    createdAt: text(firstValue(record, "created_at", "createdAt")),
    updatedAt: text(firstValue(record, "updated_at", "updatedAt")),
  };
}

export async function listPromotions(
  params: PromotionListParams = {},
): Promise<PromotionListResult> {
  if (MARKETING_USES_MOCK_DATA) return mockListPromotions(params);

  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const data = await apiGet(API_ROUTES.marketingPromotions, {
    params: {
      page,
      page_size: limit,
      search: params.search?.trim() || undefined,
      status:
        params.status && params.status !== "all" ? params.status : undefined,
    },
  });
  const record = asRecord(data);
  const items = listItems(data, "promotions").map(mapPromotion);
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

export async function getPromotion(promotionId: string): Promise<Promotion> {
  if (MARKETING_USES_MOCK_DATA) return mockGetPromotion(promotionId);

  const data = await apiGet(API_ROUTES.marketingPromotion(promotionId));
  const record = asRecord(data);

  return mapPromotion(firstValue(record, "promotion") ?? data);
}

export async function createPromotion(payload: PromotionPayload) {
  if (MARKETING_USES_MOCK_DATA) return mockCreatePromotion(payload);

  const data = await apiPost(API_ROUTES.marketingPromotions, payload);
  const record = asRecord(data);
  const created = asRecord(firstValue(record, "promotion") ?? data);

  return text(
    firstValue(created, "id", "promotion_id", "promotionId", "reference"),
  );
}

export async function updatePromotion(
  promotionId: string,
  payload: PromotionPayload,
) {
  if (MARKETING_USES_MOCK_DATA) return mockUpdatePromotion(promotionId, payload);

  return apiPatch(API_ROUTES.marketingPromotion(promotionId), payload);
}

export async function deletePromotion(promotionId: string) {
  if (MARKETING_USES_MOCK_DATA) return mockDeletePromotion(promotionId);

  return apiDelete(API_ROUTES.marketingPromotion(promotionId));
}

function mapReferralStats(value: unknown): ReferralStats {
  const record = asRecord(value);

  return {
    totalReferrals: number(
      firstValue(record, "total_referrals", "totalReferrals", "total", "shared"),
    ),
    successfulReferrals: number(
      firstValue(
        record,
        "successful_referrals",
        "successfulReferrals",
        "successful",
        "converted",
      ),
    ),
    rewardsPaidTzs: number(
      firstValue(record, "rewards_paid_tzs", "rewardsPaidTzs", "rewards_paid", "rewardsPaid"),
    ),
    newUserLtvTzs: number(
      firstValue(
        record,
        "new_user_ltv_tzs",
        "newUserLtvTzs",
        "new_user_ltv",
        "newUserLtv",
        "average_ltv_tzs",
      ),
    ),
    averageRidesPerUser: optionalNumber(
      firstValue(
        record,
        "average_rides_per_user",
        "averageRidesPerUser",
        "avg_rides_per_user",
        "avgRidesPerUser",
      ),
    ),
    roiPercent: number(
      firstValue(record, "roi_percent", "roiPercent", "roi"),
    ),
    periodLabel:
      text(firstValue(record, "period_label", "periodLabel", "period")) ||
      new Date().toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
  };
}

function mapReferralConfig(value: unknown): ReferralConfig {
  const record = asRecord(value);
  const status = text(firstValue(record, "status", "state")).toLowerCase();

  return {
    status: status === "inactive" || status === "disabled" ? "inactive" : "active",
    referrerRewardTzs: number(
      firstValue(
        record,
        "referrer_reward_tzs",
        "referrerRewardTzs",
        "referrer_reward",
        "referrerReward",
      ),
    ),
    refereeRewardTzs: number(
      firstValue(
        record,
        "referee_reward_tzs",
        "refereeRewardTzs",
        "referee_reward",
        "refereeReward",
      ),
    ),
    maxReferralsPerUser: number(
      firstValue(
        record,
        "max_referrals_per_user",
        "maxReferralsPerUser",
        "max_referrals",
        "maxReferrals",
      ),
      50,
    ),
    rewardExpiryDays: number(
      firstValue(
        record,
        "reward_expiry_days",
        "rewardExpiryDays",
        "expiry_days",
        "expiryDays",
      ),
      30,
    ),
  };
}

function mapReferralLeader(value: unknown, index: number): ReferralLeader {
  const record = asRecord(value);

  return {
    id:
      text(firstValue(record, "id", "user_id", "userId", "referrer_id")) ||
      `leader-${index}`,
    name:
      nameFrom(firstValue(record, "user", "referrer")) ||
      text(firstValue(record, "name", "referrer_name", "referrerName")) ||
      "Unknown user",
    userType: normalizeUserType(
      firstValue(record, "user_type", "userType", "type", "role"),
    ),
    referrals: number(
      firstValue(record, "referrals", "referral_count", "referralCount", "count"),
    ),
    rewardsTzs: number(
      firstValue(record, "rewards_tzs", "rewardsTzs", "earned_tzs", "earnedTzs"),
    ),
  };
}

export async function getReferralOverview(
  period = "month",
): Promise<ReferralOverview> {
  if (MARKETING_USES_MOCK_DATA) return mockGetReferralOverview(period);

  const data = await apiGet(API_ROUTES.marketingReferralOverview, {
    params: { period },
  });
  const record = asRecord(data);
  const stats = asRecord(
    firstValue(record, "stats", "statistics") ?? record,
  );
  const config = asRecord(
    firstValue(record, "config", "program", "program_config", "programConfig") ?? record,
  );
  const leaders = objectArray(
    firstValue(
      record,
      "top_referrers",
      "topReferrers",
      "leaderboard",
      "top_users",
      "topUsers",
    ),
  );

  return {
    stats: mapReferralStats(stats),
    config: mapReferralConfig(config),
    topReferrers: leaders.map(mapReferralLeader),
  };
}

function mapReferral(value: unknown): Referral {
  const record = asRecord(value);
  const referrerValue = firstValue(record, "referrer", "referrer_user");
  const refereeValue = firstValue(record, "referee", "referee_user");
  const referrer = asRecord(referrerValue);
  const referee = asRecord(refereeValue);

  return {
    id: requiredText(record, "id", "referral_id", "referralId", "reference"),
    referrerName:
      nameFrom(referrerValue) ||
      text(firstValue(record, "referrer_name", "referrerName")) ||
      "Unknown",
    referrerId:
      text(
        firstValue(referrer, "id", "user_id", "userId") ??
          firstValue(record, "referrer_id", "referrerId"),
      ) || undefined,
    referrerType: normalizeUserType(
      firstValue(referrer, "type", "role", "user_type") ??
        firstValue(record, "referrer_type", "referrerType"),
    ),
    refereeName:
      nameFrom(refereeValue) ||
      text(firstValue(record, "referee_name", "refereeName")) ||
      "Unknown",
    refereeId:
      text(
        firstValue(referee, "id", "user_id", "userId") ??
          firstValue(record, "referee_id", "refereeId"),
      ) || undefined,
    createdAt: text(
      firstValue(record, "created_at", "createdAt", "date", "referred_at"),
    ),
    status:
      text(firstValue(record, "status", "reward_status", "rewardStatus")).toLowerCase() ||
      "pending",
    referrerRewardTzs: number(
      firstValue(
        record,
        "referrer_reward_tzs",
        "referrerRewardTzs",
        "referrer_reward",
        "referrerReward",
      ),
    ),
    refereeRewardTzs: number(
      firstValue(
        record,
        "referee_reward_tzs",
        "refereeRewardTzs",
        "referee_reward",
        "refereeReward",
      ),
    ),
  };
}

export async function listReferrals(
  params: ReferralListParams = {},
): Promise<ReferralListResult> {
  if (MARKETING_USES_MOCK_DATA) return mockListReferrals(params);

  const page = params.page ?? 1;
  const limit = params.limit ?? 25;
  const data = await apiGet(API_ROUTES.marketingReferrals, {
    params: {
      page,
      page_size: limit,
      search: params.search?.trim() || undefined,
      status:
        params.status && params.status !== "all" ? params.status : undefined,
      from: params.from || undefined,
      to: params.to || undefined,
    },
  });
  const record = asRecord(data);
  const items = listItems(data, "referrals").map(mapReferral);
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

export async function updateReferralConfig(
  config: ReferralConfigFormValues,
) {
  if (MARKETING_USES_MOCK_DATA) return mockUpdateReferralConfig(config);

  return apiPatch(API_ROUTES.marketingReferralConfig, {
    status: config.status,
    referrer_reward_tzs: Number(config.referrerRewardTzs),
    referee_reward_tzs: Number(config.refereeRewardTzs),
    max_referrals_per_user: Number(config.maxReferralsPerUser),
    reward_expiry_days: Number(config.rewardExpiryDays),
  });
}
