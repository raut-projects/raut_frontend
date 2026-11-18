export type PromotionStatus = "active" | "scheduled" | "expired" | "draft";

export type PromotionTab = PromotionStatus | "all";

export type DiscountType = "percentage" | "fixed" | "free_ride";

export type Promotion = {
  id: string;
  code: string;
  name: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountTzs?: number;
  maxRideValueTzs?: number;
  newUsersOnly: boolean;
  existingUsersOnly: boolean;
  eligiblePhones?: string[];
  startsAt: string;
  endsAt: string;
  perUserLimit: number;
  totalUsesLimit?: number;
  budgetCapTzs: number;
  budgetUsedTzs: number;
  usageCount: number;
  peakHoursOnly: boolean;
  peakHoursLabel?: string;
  minimumRideTzs?: number;
  duoOnly: boolean;
  notifySms: boolean;
  inAppBanner: boolean;
  isActive: boolean;
  status: PromotionStatus;
  createdAt: string;
  updatedAt: string;
};

export type PromotionFilters = {
  status?: PromotionTab;
  search?: string;
};

export type PromotionListParams = PromotionFilters & {
  page?: number;
  limit?: number;
};

export type PromotionListResult = {
  items: Promotion[];
  total: number;
  page: number;
  limit: number;
};

export type PromotionFormValues = {
  code: string;
  name: string;
  description: string;
  discountType: DiscountType;
  discountValue: string;
  maxDiscountTzs: string;
  maxRideValueTzs: string;
  newUsers: boolean;
  existingUsers: boolean;
  specificUsers: boolean;
  eligiblePhones: string[];
  eligibleListName: string;
  startsAt: string;
  endsAt: string;
  perUserLimit: string;
  totalUsesLimit: string;
  budgetCapTzs: string;
  peakHoursOnly: boolean;
  peakHoursLabel: string;
  minimumRideEnabled: boolean;
  minimumRideTzs: string;
  duoOnly: boolean;
  notifySms: boolean;
  inAppBanner: boolean;
};

export type PromotionEligibilityCriteria = {
  new_users_only?: boolean;
  existing_users_only?: boolean;
  phones?: string[];
  min_ride_amount?: number;
  ride_types?: string[];
  peak_hours_only?: boolean;
  peak_hours_label?: string;
  notify_sms?: boolean;
  in_app_banner?: boolean;
};

export type PromotionPayload = {
  code: string;
  name: string;
  description: string;
  discount_type: DiscountType;
  discount_value: number;
  max_discount_amount?: number;
  start_date: string;
  end_date: string;
  per_user_limit: number;
  total_uses_limit?: number;
  budget_cap_tzs: number;
  eligibility_criteria: PromotionEligibilityCriteria;
  is_active: boolean;
};

export const PROMOTION_STATUS_LABELS: Record<PromotionStatus, string> = {
  active: "Active",
  scheduled: "Scheduled",
  expired: "Expired",
  draft: "Draft",
};

export function derivePromotionStatus({
  isActive,
  startsAt,
  endsAt,
}: {
  isActive: boolean;
  startsAt: string;
  endsAt: string;
}): PromotionStatus {
  if (!isActive) return "draft";

  const now = Date.now();
  const start = Date.parse(startsAt);
  const end = Date.parse(endsAt);

  if (Number.isFinite(end) && end < now) return "expired";
  if (Number.isFinite(start) && start > now) return "scheduled";

  return "active";
}

export const PROMOTION_TABS: { value: PromotionTab; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "scheduled", label: "Scheduled" },
  { value: "expired", label: "Expired" },
  { value: "draft", label: "Drafts" },
];

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  percentage: "Percentage off",
  fixed: "Fixed amount",
  free_ride: "Free ride",
};

export const PROMOTION_DEFAULT_FORM: PromotionFormValues = {
  code: "",
  name: "",
  description: "",
  discountType: "percentage",
  discountValue: "",
  maxDiscountTzs: "",
  maxRideValueTzs: "",
  newUsers: true,
  existingUsers: false,
  specificUsers: false,
  eligiblePhones: [],
  eligibleListName: "",
  startsAt: "",
  endsAt: "",
  perUserLimit: "1",
  totalUsesLimit: "",
  budgetCapTzs: "",
  peakHoursOnly: false,
  peakHoursLabel: "",
  minimumRideEnabled: false,
  minimumRideTzs: "",
  duoOnly: false,
  notifySms: true,
  inAppBanner: false,
};

const PHONE_HEADER = /phone|number|msisdn|contact/i;

export function formatTzs(value: unknown) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return "TZS 0";

  return `TZS ${amount.toLocaleString("en-US")}`;
}

export function formatPromotionDateRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Dates not set";
  }

  const sameYear = start.getFullYear() === end.getFullYear();
  const startLabel = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
    timeZone: "UTC",
  });
  const endLabel = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  return `${startLabel} - ${endLabel}`;
}

export function formatReferralDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function promotionBudgetPercent(promotion: Promotion) {
  const cap = Number(promotion.budgetCapTzs);

  if (!Number.isFinite(cap) || cap <= 0) return 0;

  return Math.min(100, Math.round((Number(promotion.budgetUsedTzs) / cap) * 100));
}

export function promotionBudgetTone(percent: number) {
  if (percent >= 90) return "bg-rose-500";
  if (percent >= 70) return "bg-amber-500";

  return "bg-brand-600";
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generatePromotionCode() {
  let suffix = "";

  for (let index = 0; index < 5; index += 1) {
    suffix += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }

  return `PROMO-${suffix}`;
}

export function normalizePhone(value: string) {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (!digits) return "";
  if (digits.startsWith("255")) return `+${digits}`;
  if (digits.startsWith("0")) return `+255${digits.slice(1)}`;
  if (digits.length === 9) return `+255${digits}`;

  return `+${digits}`;
}

export function parsePhoneListCsv(text: string) {
  const rows = String(text ?? "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n|,/)
    .map((row) => row.trim())
    .filter(Boolean);

  const phones = new Set<string>();

  rows.forEach((row, index) => {
    if (index === 0 && PHONE_HEADER.test(row)) return;

    const phone = normalizePhone(row);

    if (phone) phones.add(phone);
  });

  return Array.from(phones);
}

const pad = (value: number) => String(value).padStart(2, "0");

export function toDateTimeLocal(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDateTimeLocal(value: string) {
  if (!value) return "";

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

export function defaultDateTimeLocal(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  date.setSeconds(0, 0);

  return toDateTimeLocal(date.toISOString());
}

export function promotionToFormValues(promotion: Promotion): PromotionFormValues {
  return {
    code: promotion.code,
    name: promotion.name,
    description: promotion.description,
    discountType: promotion.discountType,
    discountValue:
      promotion.discountType === "free_ride"
        ? ""
        : String(promotion.discountValue ?? ""),
    maxDiscountTzs:
      promotion.maxDiscountTzs !== undefined
        ? String(promotion.maxDiscountTzs)
        : "",
    maxRideValueTzs:
      promotion.maxRideValueTzs !== undefined
        ? String(promotion.maxRideValueTzs)
        : "",
    newUsers: promotion.newUsersOnly,
    existingUsers: promotion.existingUsersOnly,
    specificUsers: Boolean(promotion.eligiblePhones?.length),
    eligiblePhones: promotion.eligiblePhones ?? [],
    eligibleListName: promotion.eligiblePhones?.length
      ? `Existing list (${promotion.eligiblePhones.length} numbers)`
      : "",
    startsAt: toDateTimeLocal(promotion.startsAt),
    endsAt: toDateTimeLocal(promotion.endsAt),
    perUserLimit: String(promotion.perUserLimit ?? 1),
    totalUsesLimit:
      promotion.totalUsesLimit !== undefined
        ? String(promotion.totalUsesLimit)
        : "",
    budgetCapTzs: String(promotion.budgetCapTzs ?? ""),
    peakHoursOnly: promotion.peakHoursOnly,
    peakHoursLabel: promotion.peakHoursLabel ?? "",
    minimumRideEnabled: promotion.minimumRideTzs !== undefined,
    minimumRideTzs:
      promotion.minimumRideTzs !== undefined
        ? String(promotion.minimumRideTzs)
        : "",
    duoOnly: promotion.duoOnly,
    notifySms: promotion.notifySms,
    inAppBanner: promotion.inAppBanner,
  };
}

const numberOrUndefined = (value: string) => {
  const amount = Number(value);

  return value.trim() !== "" && Number.isFinite(amount) ? amount : undefined;
};

export function toPromotionPayload(
  values: PromotionFormValues,
  isActive: boolean,
): PromotionPayload {
  const phones =
    values.specificUsers && values.eligiblePhones.length
      ? values.eligiblePhones
      : undefined;

  return {
    code: values.code.trim().toUpperCase(),
    name: values.name.trim(),
    description: values.description.trim(),
    discount_type: values.discountType,
    discount_value:
      values.discountType === "free_ride"
        ? 0
        : Number(values.discountValue),
    max_discount_amount:
      values.discountType === "percentage"
        ? numberOrUndefined(values.maxDiscountTzs)
        : values.discountType === "free_ride"
          ? numberOrUndefined(values.maxRideValueTzs)
          : undefined,
    start_date: fromDateTimeLocal(values.startsAt),
    end_date: fromDateTimeLocal(values.endsAt),
    per_user_limit: Number(values.perUserLimit),
    total_uses_limit: numberOrUndefined(values.totalUsesLimit),
    budget_cap_tzs: Number(values.budgetCapTzs),
    eligibility_criteria: {
      new_users_only: values.newUsers,
      existing_users_only: values.existingUsers,
      phones,
      min_ride_amount: values.minimumRideEnabled
        ? numberOrUndefined(values.minimumRideTzs)
        : undefined,
      ride_types: values.duoOnly ? ["duo"] : undefined,
      peak_hours_only: values.peakHoursOnly,
      peak_hours_label: values.peakHoursOnly
        ? values.peakHoursLabel.trim()
        : undefined,
      notify_sms: values.notifySms,
      in_app_banner: values.inAppBanner,
    },
    is_active: isActive,
  };
}
