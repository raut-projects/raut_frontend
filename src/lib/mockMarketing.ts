import type {
  Promotion,
  PromotionListParams,
  PromotionListResult,
  PromotionPayload,
  Referral,
  ReferralConfig,
  ReferralConfigFormValues,
  ReferralLeader,
  ReferralListParams,
  ReferralListResult,
  ReferralOverview,
  ReferralStats,
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

const MOCK_REFERRAL_STATS: ReferralStats = {
  totalReferrals: 486,
  successfulReferrals: 312,
  rewardsPaidTzs: 4_680_000,
  newUserLtvTzs: 12_400_000,
  averageRidesPerUser: 4.6,
  roiPercent: 165,
  periodLabel: "This month",
};

const MOCK_TOP_REFERRERS: ReferralLeader[] = [
  {
    id: "usr_mock_neema",
    name: "Neema Mushi",
    userType: "rider",
    referrals: 28,
    rewardsTzs: 140_000,
  },
  {
    id: "usr_mock_joseph",
    name: "Joseph Mwakalinga",
    userType: "driver",
    referrals: 24,
    rewardsTzs: 120_000,
  },
  {
    id: "usr_mock_asha",
    name: "Asha Salum",
    userType: "rider",
    referrals: 19,
    rewardsTzs: 95_000,
  },
  {
    id: "usr_mock_frank",
    name: "Frank Msigwa",
    userType: "driver",
    referrals: 17,
    rewardsTzs: 85_000,
  },
  {
    id: "usr_mock_zawadi",
    name: "Zawadi Peter",
    userType: "rider",
    referrals: 15,
    rewardsTzs: 75_000,
  },
];

const MOCK_REFERRALS: Referral[] = [
  {
    id: "ref_mock_001",
    referrerName: "Neema Mushi",
    referrerId: "usr_mock_neema",
    referrerType: "rider",
    refereeName: "Baraka John",
    refereeId: "usr_mock_baraka",
    createdAt: daysFromNow(-1),
    status: "completed",
    referrerRewardTzs: 5_000,
    refereeRewardTzs: 3_000,
  },
  {
    id: "ref_mock_002",
    referrerName: "Joseph Mwakalinga",
    referrerId: "usr_mock_joseph",
    referrerType: "driver",
    refereeName: "Halima Said",
    refereeId: "usr_mock_halima",
    createdAt: daysFromNow(-2),
    status: "completed",
    referrerRewardTzs: 5_000,
    refereeRewardTzs: 3_000,
  },
  {
    id: "ref_mock_003",
    referrerName: "Asha Salum",
    referrerId: "usr_mock_asha",
    referrerType: "rider",
    refereeName: "Juma Ally",
    refereeId: "usr_mock_juma",
    createdAt: daysFromNow(-3),
    status: "pending",
    referrerRewardTzs: 5_000,
    refereeRewardTzs: 3_000,
  },
  {
    id: "ref_mock_004",
    referrerName: "Frank Msigwa",
    referrerId: "usr_mock_frank",
    referrerType: "driver",
    refereeName: "Grace Mushi",
    refereeId: "usr_mock_grace",
    createdAt: daysFromNow(-5),
    status: "completed",
    referrerRewardTzs: 5_000,
    refereeRewardTzs: 3_000,
  },
  {
    id: "ref_mock_005",
    referrerName: "Zawadi Peter",
    referrerId: "usr_mock_zawadi",
    referrerType: "rider",
    refereeName: "Emmanuel Kessy",
    refereeId: "usr_mock_emmanuel",
    createdAt: daysFromNow(-6),
    status: "completed",
    referrerRewardTzs: 5_000,
    refereeRewardTzs: 3_000,
  },
  {
    id: "ref_mock_006",
    referrerName: "Neema Mushi",
    referrerId: "usr_mock_neema",
    referrerType: "rider",
    refereeName: "Rehema Msuya",
    refereeId: "usr_mock_rehema",
    createdAt: daysFromNow(-9),
    status: "expired",
    referrerRewardTzs: 5_000,
    refereeRewardTzs: 3_000,
  },
  {
    id: "ref_mock_007",
    referrerName: "Joseph Mwakalinga",
    referrerId: "usr_mock_joseph",
    referrerType: "driver",
    refereeName: "Amina Rajab",
    refereeId: "usr_mock_amina",
    createdAt: daysFromNow(-11),
    status: "completed",
    referrerRewardTzs: 5_000,
    refereeRewardTzs: 3_000,
  },
  {
    id: "ref_mock_008",
    referrerName: "Asha Salum",
    referrerId: "usr_mock_asha",
    referrerType: "rider",
    refereeName: "Peter Mwita",
    refereeId: "usr_mock_peter",
    createdAt: daysFromNow(-14),
    status: "pending",
    referrerRewardTzs: 5_000,
    refereeRewardTzs: 3_000,
  },
  {
    id: "ref_mock_009",
    referrerName: "Frank Msigwa",
    referrerId: "usr_mock_frank",
    referrerType: "driver",
    refereeName: "Sofia Mkwawa",
    refereeId: "usr_mock_sofia",
    createdAt: daysFromNow(-17),
    status: "completed",
    referrerRewardTzs: 5_000,
    refereeRewardTzs: 3_000,
  },
  {
    id: "ref_mock_010",
    referrerName: "Zawadi Peter",
    referrerId: "usr_mock_zawadi",
    referrerType: "rider",
    refereeName: "Daniel Lyimo",
    refereeId: "usr_mock_daniel",
    createdAt: daysFromNow(-20),
    status: "completed",
    referrerRewardTzs: 5_000,
    refereeRewardTzs: 3_000,
  },
  {
    id: "ref_mock_011",
    referrerName: "Neema Mushi",
    referrerId: "usr_mock_neema",
    referrerType: "rider",
    refereeName: "Fatuma Hassan",
    refereeId: "usr_mock_fatuma",
    createdAt: daysFromNow(-23),
    status: "expired",
    referrerRewardTzs: 5_000,
    refereeRewardTzs: 3_000,
  },
  {
    id: "ref_mock_012",
    referrerName: "Joseph Mwakalinga",
    referrerId: "usr_mock_joseph",
    referrerType: "driver",
    refereeName: "Ibrahim Suleiman",
    refereeId: "usr_mock_ibrahim",
    createdAt: daysFromNow(-26),
    status: "completed",
    referrerRewardTzs: 5_000,
    refereeRewardTzs: 3_000,
  },
  {
    id: "ref_mock_013",
    referrerName: "Asha Salum",
    referrerId: "usr_mock_asha",
    referrerType: "rider",
    refereeName: "Mwajuma Said",
    refereeId: "usr_mock_mwajuma",
    createdAt: daysFromNow(-29),
    status: "pending",
    referrerRewardTzs: 5_000,
    refereeRewardTzs: 3_000,
  },
  {
    id: "ref_mock_014",
    referrerName: "Frank Msigwa",
    referrerId: "usr_mock_frank",
    referrerType: "driver",
    refereeName: "Kelvin Mushi",
    refereeId: "usr_mock_kelvin",
    createdAt: daysFromNow(-31),
    status: "completed",
    referrerRewardTzs: 5_000,
    refereeRewardTzs: 3_000,
  },
];

let promotions: Promotion[] = MOCK_PROMOTIONS.map((promotion) => ({
  ...promotion,
  eligiblePhones: promotion.eligiblePhones
    ? [...promotion.eligiblePhones]
    : undefined,
}));

let referrals: Referral[] = MOCK_REFERRALS.map((referral) => ({ ...referral }));

let referralConfig: ReferralConfig = {
  status: "active",
  referrerRewardTzs: 5_000,
  refereeRewardTzs: 3_000,
  maxReferralsPerUser: 10,
  rewardExpiryDays: 30,
};

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

export async function mockGetReferralOverview(
  period = "month",
): Promise<ReferralOverview> {
  await wait();

  return {
    stats: {
      ...MOCK_REFERRAL_STATS,
      periodLabel: period === "week" ? "This week" : "This month",
    },
    config: { ...referralConfig },
    topReferrers: MOCK_TOP_REFERRERS.map((leader) => ({ ...leader })),
  };
}

export async function mockListReferrals(
  params: ReferralListParams = {},
): Promise<ReferralListResult> {
  await wait();

  const page = params.page ?? 1;
  const limit = params.limit ?? 25;
  const status = params.status?.toLowerCase() ?? "all";
  const from = params.from || "";
  const to = params.to || "";
  const filtered = referrals
    .filter((referral) => {
      if (status !== "all" && referral.status.toLowerCase() !== status) {
        return false;
      }

      const createdDate = referral.createdAt.slice(0, 10);

      if (from && createdDate < from) return false;
      if (to && createdDate > to) return false;

      return matchesSearch(
        [referral.referrerName, referral.refereeName, referral.id],
        params.search ?? "",
      );
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const start = (page - 1) * limit;

  return {
    items: filtered
      .slice(start, start + limit)
      .map((referral) => ({ ...referral })),
    total: filtered.length,
    page,
    limit,
  };
}

export async function mockUpdateReferralConfig(
  config: ReferralConfigFormValues,
): Promise<void> {
  await wait();

  referralConfig = {
    status: config.status,
    referrerRewardTzs: Number(config.referrerRewardTzs),
    refereeRewardTzs: Number(config.refereeRewardTzs),
    maxReferralsPerUser: Number(config.maxReferralsPerUser),
    rewardExpiryDays: Number(config.rewardExpiryDays),
  };
}
