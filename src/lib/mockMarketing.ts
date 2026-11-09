import type {
  Promotion,
  PromotionListParams,
  PromotionListResult,
  PromotionPayload,
} from "@/lib/marketing";

const MOCK_DELAY_MS = 160;

export const MARKETING_USES_MOCK_DATA =
  process.env.NEXT_PUBLIC_USE_MOCK_MARKETING !== "false";

const wait = (duration = MOCK_DELAY_MS) =>
  new Promise<void>((resolve) => setTimeout(resolve, duration));

const daysFromNow = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

const MOCK_PROMOTIONS: Promotion[] = [
  {
    id: "promo_mock_rafiki20",
    code: "RAFIKI20",
    name: "Rafiki Welcome 20%",
    description:
      "20% off the first three rides for riders who joined in the last 30 days.",
    discountType: "percentage",
    discountValue: 20,
    maxDiscountTzs: 3_000,
    newUsersOnly: true,
    existingUsersOnly: false,
    startsAt: daysFromNow(-12),
    endsAt: daysFromNow(18),
    perUserLimit: 3,
    totalUsesLimit: 5_000,
    budgetCapTzs: 2_000_000,
    budgetUsedTzs: 1_240_000,
    usageCount: 842,
    peakHoursOnly: false,
    minimumRideTzs: 2_500,
    duoOnly: false,
    notifySms: true,
    inAppBanner: true,
    status: "active",
    createdAt: daysFromNow(-20),
    updatedAt: daysFromNow(-2),
  },
  {
    id: "promo_mock_karibu5k",
    code: "KARIBU5K",
    name: "Karibu 5,000 Off",
    description: "Flat TZS 5,000 off for new riders on rides above TZS 4,000.",
    discountType: "fixed",
    discountValue: 5_000,
    newUsersOnly: true,
    existingUsersOnly: false,
    startsAt: daysFromNow(-8),
    endsAt: daysFromNow(9),
    perUserLimit: 2,
    totalUsesLimit: 3_000,
    budgetCapTzs: 1_500_000,
    budgetUsedTzs: 720_000,
    usageCount: 144,
    peakHoursOnly: false,
    minimumRideTzs: 4_000,
    duoOnly: false,
    notifySms: true,
    inAppBanner: true,
    status: "active",
    createdAt: daysFromNow(-10),
    updatedAt: daysFromNow(-1),
  },
  {
    id: "promo_mock_usiku_duo",
    code: "USIKU_DUO",
    name: "Usiku DUO Free Ride",
    description:
      "Free DUO ride between 21:00 and 23:59 when two riders travel together.",
    discountType: "free_ride",
    discountValue: 0,
    newUsersOnly: false,
    existingUsersOnly: true,
    startsAt: daysFromNow(-5),
    endsAt: daysFromNow(25),
    perUserLimit: 1,
    totalUsesLimit: 1_200,
    budgetCapTzs: 3_000_000,
    budgetUsedTzs: 1_110_000,
    usageCount: 370,
    peakHoursOnly: true,
    peakHoursLabel: "21:00 - 23:59",
    duoOnly: true,
    notifySms: false,
    inAppBanner: true,
    status: "active",
    createdAt: daysFromNow(-7),
    updatedAt: daysFromNow(-3),
  },
  {
    id: "promo_mock_weekend15",
    code: "WEEKEND15",
    name: "Weekend 15% Off",
    description:
      "15% off weekend rides for all riders, capped at TZS 5,000 per ride.",
    discountType: "percentage",
    discountValue: 15,
    maxDiscountTzs: 5_000,
    newUsersOnly: true,
    existingUsersOnly: true,
    startsAt: daysFromNow(-25),
    endsAt: daysFromNow(30),
    perUserLimit: 4,
    totalUsesLimit: 10_000,
    budgetCapTzs: 4_000_000,
    budgetUsedTzs: 2_860_000,
    usageCount: 1_430,
    peakHoursOnly: false,
    minimumRideTzs: 1_500,
    duoOnly: false,
    notifySms: true,
    inAppBanner: true,
    status: "active",
    createdAt: daysFromNow(-28),
    updatedAt: daysFromNow(-1),
  },
  {
    id: "promo_mock_viplist10",
    code: "VIPLIST10",
    name: "VIP List 10%",
    description:
      "Private 10% offer for riders on the imported VIP phone list.",
    discountType: "percentage",
    discountValue: 10,
    maxDiscountTzs: 4_000,
    newUsersOnly: false,
    existingUsersOnly: false,
    eligiblePhones: [
      "+255712345678",
      "+255754987654",
      "+255789123456",
    ],
    startsAt: daysFromNow(3),
    endsAt: daysFromNow(33),
    perUserLimit: 1,
    totalUsesLimit: 500,
    budgetCapTzs: 800_000,
    budgetUsedTzs: 0,
    usageCount: 0,
    peakHoursOnly: false,
    duoOnly: false,
    notifySms: true,
    inAppBanner: false,
    status: "scheduled",
    createdAt: daysFromNow(-2),
    updatedAt: daysFromNow(-2),
  },
  {
    id: "promo_mock_shule3k",
    code: "SHULE3K",
    name: "Shule Run 3,000 Off",
    description:
      "TZS 3,000 off school-run rides for new riders in Dar es Salaam.",
    discountType: "fixed",
    discountValue: 3_000,
    newUsersOnly: true,
    existingUsersOnly: false,
    startsAt: daysFromNow(6),
    endsAt: daysFromNow(36),
    perUserLimit: 3,
    totalUsesLimit: 2_500,
    budgetCapTzs: 1_000_000,
    budgetUsedTzs: 0,
    usageCount: 0,
    peakHoursOnly: false,
    minimumRideTzs: 2_500,
    duoOnly: false,
    notifySms: true,
    inAppBanner: true,
    status: "scheduled",
    createdAt: daysFromNow(-1),
    updatedAt: daysFromNow(-1),
  },
  {
    id: "promo_mock_easter25",
    code: "EASTER25",
    name: "Easter 25% Off",
    description: "Holiday campaign with 25% off, capped at TZS 4,000.",
    discountType: "percentage",
    discountValue: 25,
    maxDiscountTzs: 4_000,
    newUsersOnly: true,
    existingUsersOnly: true,
    startsAt: daysFromNow(-75),
    endsAt: daysFromNow(-45),
    perUserLimit: 2,
    totalUsesLimit: 6_000,
    budgetCapTzs: 2_000_000,
    budgetUsedTzs: 1_980_000,
    usageCount: 1_120,
    peakHoursOnly: false,
    duoOnly: false,
    notifySms: true,
    inAppBanner: true,
    status: "expired",
    createdAt: daysFromNow(-90),
    updatedAt: daysFromNow(-45),
  },
  {
    id: "promo_mock_usiku10k",
    code: "USIKU10K",
    name: "Late Night 10,000 Off",
    description: "Flat TZS 10,000 off late-night rides for existing riders.",
    discountType: "fixed",
    discountValue: 10_000,
    newUsersOnly: false,
    existingUsersOnly: true,
    startsAt: daysFromNow(-60),
    endsAt: daysFromNow(-20),
    perUserLimit: 2,
    totalUsesLimit: 1_500,
    budgetCapTzs: 1_200_000,
    budgetUsedTzs: 980_000,
    usageCount: 98,
    peakHoursOnly: true,
    peakHoursLabel: "22:00 - 04:00",
    duoOnly: false,
    notifySms: false,
    inAppBanner: false,
    status: "expired",
    createdAt: daysFromNow(-65),
    updatedAt: daysFromNow(-20),
  },
  {
    id: "promo_mock_draft_mwanzo",
    code: "DRAFT_MWANZO",
    name: "Mwanzo 30% (draft)",
    description: "Trial onboarding offer for first-time riders. Awaiting approval.",
    discountType: "percentage",
    discountValue: 30,
    maxDiscountTzs: 5_000,
    newUsersOnly: true,
    existingUsersOnly: false,
    startsAt: daysFromNow(10),
    endsAt: daysFromNow(40),
    perUserLimit: 2,
    totalUsesLimit: 2_000,
    budgetCapTzs: 2_500_000,
    budgetUsedTzs: 0,
    usageCount: 0,
    peakHoursOnly: false,
    duoOnly: false,
    notifySms: true,
    inAppBanner: true,
    status: "draft",
    createdAt: daysFromNow(-1),
    updatedAt: daysFromNow(-1),
  },
  {
    id: "promo_mock_draft_duo",
    code: "DRAFT_DUO",
    name: "DUO Weekend (draft)",
    description: "Free DUO weekend rides. Draft pending finance review.",
    discountType: "free_ride",
    discountValue: 0,
    newUsersOnly: false,
    existingUsersOnly: true,
    startsAt: daysFromNow(14),
    endsAt: daysFromNow(44),
    perUserLimit: 1,
    totalUsesLimit: 800,
    budgetCapTzs: 1_000_000,
    budgetUsedTzs: 0,
    usageCount: 0,
    peakHoursOnly: false,
    duoOnly: true,
    notifySms: false,
    inAppBanner: true,
    status: "draft",
    createdAt: daysFromNow(-3),
    updatedAt: daysFromNow(-3),
  },
];

let promotions: Promotion[] = MOCK_PROMOTIONS.map((promotion) => ({
  ...promotion,
  eligiblePhones: promotion.eligiblePhones
    ? [...promotion.eligiblePhones]
    : undefined,
}));


const matchesSearch = (values: Array<string | undefined>, search: string) => {
  const query = search.trim().toLowerCase();

  if (!query) return true;

  return values.some((value) => value?.toLowerCase().includes(query));
};

export async function mockListPromotions(
  params: PromotionListParams = {},
): Promise<PromotionListResult> {
  await wait();

  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const status = params.status ?? "all";
  const filtered = promotions.filter((promotion) => {
    if (status !== "all" && promotion.status !== status) return false;

    return matchesSearch(
      [promotion.code, promotion.name, promotion.description],
      params.search ?? "",
    );
  });
  const start = (page - 1) * limit;

  return {
    items: filtered
      .slice(start, start + limit)
      .map((promotion) => ({ ...promotion })),
    total: filtered.length,
    page,
    limit,
  };
}

export async function mockGetPromotion(promotionId: string): Promise<Promotion> {
  await wait();

  const promotion = promotions.find((item) => item.id === promotionId);

  if (!promotion) {
    throw new Error("The promotion could not be found.");
  }

  return { ...promotion };
}

const promotionFromPayload = (
  payload: PromotionPayload,
  id: string,
  existing?: Promotion,
): Promotion => {
  const timestamp = new Date().toISOString();

  return {
    id,
    code: payload.code,
    name: payload.name,
    description: payload.description,
    discountType: payload.discount_type,
    discountValue: payload.discount_value,
    maxDiscountTzs: payload.max_discount_tzs,
    maxRideValueTzs: payload.max_ride_value_tzs,
    newUsersOnly: payload.eligibility.new_users,
    existingUsersOnly: payload.eligibility.existing_users,
    eligiblePhones: payload.eligibility.phones?.length
      ? [...payload.eligibility.phones]
      : undefined,
    startsAt: payload.starts_at,
    endsAt: payload.ends_at,
    perUserLimit: payload.per_user_limit,
    totalUsesLimit: payload.total_uses_limit,
    budgetCapTzs: payload.budget_cap_tzs,
    budgetUsedTzs: existing?.budgetUsedTzs ?? 0,
    usageCount: existing?.usageCount ?? 0,
    peakHoursOnly: payload.peak_hours_only,
    peakHoursLabel: payload.peak_hours_label,
    minimumRideTzs: payload.minimum_ride_tzs,
    duoOnly: payload.duo_only,
    notifySms: payload.notify_sms,
    inAppBanner: payload.in_app_banner,
    status: payload.status,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
};

export async function mockCreatePromotion(
  payload: PromotionPayload,
): Promise<string> {
  await wait();

  const id = `promo_mock_${Date.now()}`;
  promotions = [promotionFromPayload(payload, id), ...promotions];

  return id;
}

export async function mockUpdatePromotion(
  promotionId: string,
  payload: PromotionPayload,
): Promise<void> {
  await wait();

  const index = promotions.findIndex((item) => item.id === promotionId);

  if (index === -1) {
    throw new Error("The promotion could not be found.");
  }

  promotions[index] = promotionFromPayload(payload, promotionId, promotions[index]);
}

export async function mockDeletePromotion(promotionId: string): Promise<void> {
  await wait();

  const index = promotions.findIndex((item) => item.id === promotionId);

  if (index === -1) {
    throw new Error("The promotion could not be found.");
  }

  promotions = promotions.filter((item) => item.id !== promotionId);
}
