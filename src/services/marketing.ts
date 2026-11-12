import { API_ROUTES } from "@/lib/config";
import { derivePromotionStatus } from "@/lib/marketing";
import type {
  DiscountType,
  Promotion,
  PromotionListParams,
  PromotionListResult,
  PromotionPayload,
  PromotionStatus,
} from "@/lib/marketing";
import { apiDelete, apiGet, apiPost, apiPut } from "./api";

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
  if (status === "expired" || status === "ended") return "expired";
  if (status === "inactive" || status === "paused") return "draft";
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

export function mapPromotion(value: unknown): Promotion {
  const record = asRecord(value);
  const eligibility = asRecord(
    firstValue(record, "eligibility_criteria", "eligibility"),
  );
  const startsAt = text(
    firstValue(record, "start_date", "starts_at", "startsAt", "startDate", "start"),
  );
  const endsAt = text(
    firstValue(record, "end_date", "ends_at", "endsAt", "endDate", "end"),
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
  const maxDiscountAmount = optionalNumber(
    firstValue(record, "max_discount_amount", "maxDiscountAmount"),
  );
  const legacyMaxDiscount = optionalNumber(
    firstValue(
      record,
      "max_discount_tzs",
      "maxDiscountTzs",
      "max_discount",
      "maxDiscount",
    ),
  );
  const legacyMaxRideValue = optionalNumber(
    firstValue(
      record,
      "max_ride_value_tzs",
      "maxRideValueTzs",
      "max_ride_value",
      "maxRideValue",
    ),
  );
  const phoneList =
    firstValue(eligibility, "phones", "eligible_phones", "eligiblePhones") ??
    firstValue(record, "eligible_phones", "eligiblePhones", "user_list", "userList");
  const eligiblePhones = Array.isArray(phoneList)
    ? phoneList.map((phone) => text(phone)).filter(Boolean)
    : [];
  const rideTypesValue = firstValue(eligibility, "ride_types", "rideTypes");
  const rideTypes = Array.isArray(rideTypesValue)
    ? rideTypesValue.map((type) => text(type).toLowerCase()).filter(Boolean)
    : [];

  const usageCount = number(
    firstValue(
      record,
      "current_uses",
      "currentUses",
      "usage_count",
      "usageCount",
      "used_count",
      "usedCount",
      "redemptions",
    ),
  );
  const recordedBudget = number(
    firstValue(
      record,
      "current_spend_tzs",
      "currentSpendTzs",
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
  const explicitStatus = firstValue(record, "status", "state");
  const isActiveValue = firstValue(record, "is_active", "isActive");
  const isActive =
    isActiveValue === undefined
      ? normalizeStatus(explicitStatus, startsAt, endsAt) !== "draft"
      : truthy(isActiveValue);
  const status =
    isActiveValue === undefined
      ? normalizeStatus(explicitStatus, startsAt, endsAt)
      : derivePromotionStatus({ isActive, startsAt, endsAt });

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
    maxDiscountTzs:
      discountType === "free_ride"
        ? legacyMaxDiscount
        : (maxDiscountAmount ?? legacyMaxDiscount),
    maxRideValueTzs:
      discountType === "free_ride"
        ? (maxDiscountAmount ?? legacyMaxRideValue)
        : legacyMaxRideValue,
    newUsersOnly: truthy(
      firstValue(eligibility, "new_users_only", "new_users", "newUsers") ??
        firstValue(record, "new_users_only", "newUsersOnly", "new_users"),
    ),
    existingUsersOnly: truthy(
      firstValue(
        eligibility,
        "existing_users_only",
        "existing_users",
        "existingUsers",
      ) ??
        firstValue(
          record,
          "existing_users_only",
          "existingUsersOnly",
          "existing_users",
        ),
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
      firstValue(eligibility, "peak_hours_only", "peakHoursOnly") ??
        firstValue(
          record,
          "peak_hours_only",
          "peakHoursOnly",
          "peak_hours",
          "peakHours",
        ),
    ),
    peakHoursLabel:
      text(
        firstValue(eligibility, "peak_hours_label", "peakHoursLabel") ??
          firstValue(record, "peak_hours_label", "peakHoursLabel", "peak_hours"),
      ) || undefined,
    minimumRideTzs: optionalNumber(
      firstValue(
        eligibility,
        "min_ride_amount",
        "minimum_ride_amount",
        "min_ride_tzs",
        "minimum_ride_tzs",
      ) ??
        firstValue(
          record,
          "minimum_ride_tzs",
          "minimumRideTzs",
          "min_ride_tzs",
          "minRideTzs",
        ),
    ),
    duoOnly:
      truthy(
        firstValue(eligibility, "duo_only", "duoOnly") ??
          firstValue(record, "duo_only", "duoOnly", "duo", "apply_to_duo"),
      ) || rideTypes.includes("duo"),
    notifySms: truthy(
      firstValue(eligibility, "notify_sms", "notifySms") ??
        firstValue(record, "notify_sms", "notifySms", "send_sms", "sendSms"),
    ),
    inAppBanner: truthy(
      firstValue(eligibility, "in_app_banner", "inAppBanner") ??
        firstValue(record, "in_app_banner", "inAppBanner", "show_banner", "showBanner"),
    ),
    isActive,
    status,
    createdAt: text(firstValue(record, "created_at", "createdAt")),
    updatedAt: text(firstValue(record, "updated_at", "updatedAt")),
  };
}

export async function listPromotions(
  params: PromotionListParams = {},
): Promise<PromotionListResult> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.max(1, params.limit ?? 20);
  const data = await apiGet(API_ROUTES.marketingPromotions);
  const items = listItems(data, "promotions").map(mapPromotion);
  const search = params.search?.trim().toLowerCase() ?? "";
  const filtered = items.filter((promotion) => {
    if (
      params.status &&
      params.status !== "all" &&
      promotion.status !== params.status
    ) {
      return false;
    }

    if (!search) return true;

    return [promotion.code, promotion.name, promotion.description].some(
      (field) => field.toLowerCase().includes(search),
    );
  });
  const start = (page - 1) * limit;

  return {
    items: filtered.slice(start, start + limit),
    total: filtered.length,
    page,
    limit,
  };
}

export async function getPromotion(promotionId: string): Promise<Promotion> {
  const data = await apiGet(API_ROUTES.marketingPromotion(promotionId));
  const record = asRecord(data);

  return mapPromotion(firstValue(record, "promotion") ?? data);
}

export async function createPromotion(payload: PromotionPayload) {
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
  return apiPut(API_ROUTES.marketingPromotion(promotionId), payload);
}

export async function deletePromotion(promotionId: string) {
  return apiDelete(API_ROUTES.marketingPromotion(promotionId));
}

export async function activatePromotion(promotionId: string) {
  return apiPost(API_ROUTES.marketingPromotionActivate(promotionId));
}

export async function deactivatePromotion(promotionId: string) {
  return apiPost(API_ROUTES.marketingPromotionDeactivate(promotionId));
}
