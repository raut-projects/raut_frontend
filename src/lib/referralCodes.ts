import { REFERRAL_BASE_URL } from "./config";

export type ReferralCodeStatus = "active" | "pending" | "expired" | "inactive";

export type ReferralCodeTab = ReferralCodeStatus | "all";

export type ReferralCodeCreateStatus = "active" | "inactive";

export type ReferralUserType = "rider" | "driver";

export type ReferralUserTypeFilter = ReferralUserType | "all";

export type ReferralRewardType = "ride_credit" | "cash_credit" | "discount";

export type ReferralDatePreset = "all" | "7d" | "30d" | "90d" | "custom";

export type ReferralCode = {
  id: string;
  name: string;
  code: string;
  assignedUserId: string;
  assignedUserName: string;
  assignedUserEmail?: string;
  assignedUserPhone?: string;
  userType: ReferralUserType;
  uses: number;
  pendingReferrals: number;
  maxUses: number;
  referrerRewardTzs: number;
  newUserRewardTzs: number;
  rewardType: ReferralRewardType;
  rewardsTzs: number;
  status: ReferralCodeStatus;
  expiryDate: string;
  createdAt: string;
};

export type ReferralCodeStats = {
  totalCodes: number;
  assigned: number;
  successfulReferrals: number;
  rewardsPaidTzs: number;
};

export type ReferralCodeFilters = {
  status?: ReferralCodeTab;
  search?: string;
  type?: ReferralUserTypeFilter;
  from?: string;
  to?: string;
};

export type ReferralCodeListParams = ReferralCodeFilters & {
  page?: number;
  limit?: number;
};

export type ReferralCodeListResult = {
  items: ReferralCode[];
  total: number;
  page: number;
  limit: number;
};

export type ReferralAssignableUser = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  userType: ReferralUserType;
};

export type ReferralCodeFormValues = {
  name: string;
  assignedUserId: string;
  userType: ReferralUserType;
  code: string;
  referrerRewardTzs: string;
  newUserRewardTzs: string;
  rewardType: ReferralRewardType;
  maxUses: string;
  expiryDate: string;
  status: ReferralCodeCreateStatus;
};

export type ReferralCodePayload = {
  name: string;
  assigned_user_id: string;
  user_type: ReferralUserType;
  code: string;
  referrer_reward_tzs: number;
  new_user_reward_tzs: number;
  reward_type: ReferralRewardType;
  max_uses: number;
  expiry_date: string;
  status: ReferralCodeCreateStatus;
};

export type ReferralCodeEditFormValues = {
  maxUses: string;
  expiryDate: string;
};

export type ReferralCodeBulkEditFormValues = {
  updateExpiry: boolean;
  expiryDate: string;
  updateMaxUses: boolean;
  maxUses: string;
};

export type ReferralCodeUpdatePayload = {
  max_uses?: number;
  expiry_date?: string;
  status?: ReferralCodeCreateStatus;
};

export type ReferralBulkAction = "activate" | "deactivate" | "delete";

export type ReferralSendChannel = "sms" | "email";

export const REFERRAL_STATUS_LABELS: Record<ReferralCodeStatus, string> = {
  active: "Active",
  pending: "Pending",
  expired: "Expired",
  inactive: "Inactive",
};

export const REFERRAL_STATUS_BADGE_CLASSES: Record<ReferralCodeStatus, string> =
  {
    active: "border-emerald-200 bg-emerald-50 text-emerald-700",
    pending: "border-amber-200 bg-amber-50 text-amber-700",
    expired: "border-slate-200 bg-slate-100 text-slate-600",
    inactive: "border-slate-200 bg-slate-100 text-slate-600",
  };

export const REFERRAL_TABS: { value: ReferralCodeTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "expired", label: "Expired" },
  { value: "inactive", label: "Inactive" },
];

export const REFERRAL_USER_TYPE_LABELS: Record<ReferralUserType, string> = {
  rider: "Rider",
  driver: "Driver",
};

export const REFERRAL_REWARD_TYPE_LABELS: Record<ReferralRewardType, string> = {
  ride_credit: "Ride credit",
  cash_credit: "Cash credit",
  discount: "Discount",
};

export const REFERRAL_DATE_PRESETS: {
  value: ReferralDatePreset;
  label: string;
}[] = [
  { value: "all", label: "All dates" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "custom", label: "Custom range" },
];

const REFERRAL_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const pad = (value: number) => String(value).padStart(2, "0");

export function toDateKey(value: Date) {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

export function defaultReferralExpiryDate(offsetDays = 30) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);

  return toDateKey(date);
}

export function createReferralCodeDefaultForm(): ReferralCodeFormValues {
  return {
    name: "",
    assignedUserId: "",
    userType: "rider",
    code: "",
    referrerRewardTzs: "2000",
    newUserRewardTzs: "1000",
    rewardType: "ride_credit",
    maxUses: "20",
    expiryDate: defaultReferralExpiryDate(),
    status: "active",
  };
}

export function generateReferralCode(name: string) {
  const base =
    String(name ?? "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6) || "RAUT";
  let suffix = "";

  for (let index = 0; index < 4; index += 1) {
    suffix +=
      REFERRAL_CODE_ALPHABET[
        Math.floor(Math.random() * REFERRAL_CODE_ALPHABET.length)
      ];
  }

  return `${base}${suffix}`;
}

export function buildReferralLink(code: string) {
  const base = (REFERRAL_BASE_URL || "https://raut.app/signup")
    .trim()
    .replace(/\/+$/, "");

  return `${base}?ref=${encodeURIComponent(
    String(code ?? "")
      .trim()
      .toUpperCase(),
  )}`;
}

export function resolveReferralDateRange(
  preset: ReferralDatePreset,
  from: string,
  to: string,
) {
  if (preset === "all") return { from: "", to: "" };
  if (preset === "custom") return { from, to };

  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  const now = new Date();
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - (days - 1),
  );

  return { from: toDateKey(start), to: toDateKey(now) };
}

export function normalizeReferralUserType(
  value: unknown,
  fallback: ReferralUserType = "rider",
): ReferralUserType {
  if (value === true || value === 1 || value === "1" || value === "true") {
    return "driver";
  }
  if (value === false || value === 0 || value === "0" || value === "false") {
    return "rider";
  }

  const type = String(value ?? "")
    .toLowerCase()
    .replace(/[-\s]/g, "_");

  if (type === "driver" || type === "riders_driver" || type === "driver_user") {
    return "driver";
  }
  if (
    type === "rider" ||
    type === "customer" ||
    type === "passenger" ||
    type === "client"
  ) {
    return "rider";
  }

  return fallback;
}

export function normalizeReferralRewardType(
  value: unknown,
): ReferralRewardType {
  const type = String(value ?? "")
    .toLowerCase()
    .replace(/[-\s]/g, "_");

  if (
    type.includes("cash") ||
    type.includes("wallet") ||
    type.includes("money")
  ) {
    return "cash_credit";
  }
  if (type.includes("discount") || type.includes("percent")) {
    return "discount";
  }

  return "ride_credit";
}

export function normalizeReferralStatus(
  storedStatus: unknown,
  expiryDate: string,
  pendingReferrals = 0,
): ReferralCodeStatus {
  const status = String(storedStatus ?? "")
    .toLowerCase()
    .replace(/[-\s]/g, "_");

  if (
    status === "inactive" ||
    status === "disabled" ||
    status === "suspended"
  ) {
    return "inactive";
  }
  if (status === "expired" || status === "ended") {
    return "expired";
  }

  const expiryKey = String(expiryDate ?? "").slice(0, 10);

  if (expiryKey && expiryKey < toDateKey(new Date())) {
    return "expired";
  }

  if (status === "pending" || pendingReferrals > 0) {
    return "pending";
  }

  return "active";
}

export function toReferralCodePayload(
  values: ReferralCodeFormValues,
): ReferralCodePayload {
  return {
    name: values.name.trim(),
    assigned_user_id: values.assignedUserId,
    user_type: values.userType,
    code: values.code.trim().toUpperCase(),
    referrer_reward_tzs: Number(values.referrerRewardTzs),
    new_user_reward_tzs: Number(values.newUserRewardTzs),
    reward_type: values.rewardType,
    max_uses: Number(values.maxUses),
    expiry_date: values.expiryDate,
    status: values.status,
  };
}

export function toReferralCodeUpdatePayload(
  values: ReferralCodeEditFormValues,
): ReferralCodeUpdatePayload {
  return {
    max_uses: Number(values.maxUses),
    expiry_date: values.expiryDate,
  };
}

export function toReferralCodeBulkUpdatePayload(
  values: ReferralCodeBulkEditFormValues,
): ReferralCodeUpdatePayload {
  const payload: ReferralCodeUpdatePayload = {};

  if (values.updateMaxUses) {
    payload.max_uses = Number(values.maxUses);
  }

  if (values.updateExpiry) {
    payload.expiry_date = values.expiryDate;
  }

  return payload;
}

export function referralStoredStatus(
  code: ReferralCode,
): ReferralCodeCreateStatus {
  return code.status === "inactive" ? "inactive" : "active";
}

export function canActivateReferralCode(code: ReferralCode) {
  return code.status === "inactive";
}

export function canDeactivateReferralCode(code: ReferralCode) {
  return code.status === "active" || code.status === "pending";
}

export function canDeleteReferralCode(code: ReferralCode) {
  return (
    code.status === "expired" ||
    (code.uses === 0 && code.pendingReferrals === 0)
  );
}

export function isReferralCodeEligibleForBulkAction(
  code: ReferralCode,
  action: ReferralBulkAction,
) {
  if (action === "activate") return canActivateReferralCode(code);
  if (action === "deactivate") return canDeactivateReferralCode(code);

  return canDeleteReferralCode(code);
}

export function partitionReferralCodesForBulkAction(
  codes: ReferralCode[],
  action: ReferralBulkAction,
) {
  const eligible: ReferralCode[] = [];
  const skipped: ReferralCode[] = [];

  for (const code of codes) {
    if (isReferralCodeEligibleForBulkAction(code, action)) {
      eligible.push(code);
    } else {
      skipped.push(code);
    }
  }

  return { eligible, skipped };
}
