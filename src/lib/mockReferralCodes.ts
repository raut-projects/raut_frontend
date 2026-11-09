import {
  normalizeReferralStatus,
  referralStoredStatus,
  type ReferralAssignableUser,
  type ReferralCode,
  type ReferralCodeListParams,
  type ReferralCodeListResult,
  type ReferralCodePayload,
  type ReferralCodeStats,
  type ReferralCodeUpdatePayload,
  type ReferralRewardType,
  type ReferralSendChannel,
  type ReferralUserType,
} from "@/lib/referralCodes";

const MOCK_DELAY_MS = 160;

export const MARKETING_USES_MOCK_DATA =
  process.env.NEXT_PUBLIC_USE_MOCK_MARKETING !== "false";

const wait = (duration = MOCK_DELAY_MS) =>
  new Promise<void>((resolve) => setTimeout(resolve, duration));

const dateFromNow = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const daysFromNow = (days: number) => dateFromNow(days).toISOString();

const dateKeyFromNow = (days: number) => {
  const date = dateFromNow(days);
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const MOCK_REFERRAL_USERS: ReferralAssignableUser[] = [
  {
    id: "usr_mock_neema",
    name: "Neema Mushi",
    email: "neema.mushi@example.com",
    phone: "+255712345601",
    userType: "rider",
  },
  {
    id: "usr_mock_joseph",
    name: "Joseph Mwakalinga",
    email: "joseph.mwakalinga@example.com",
    phone: "+255713345602",
    userType: "driver",
  },
  {
    id: "usr_mock_asha",
    name: "Asha Salum",
    email: "asha.salum@example.com",
    phone: "+255714345603",
    userType: "rider",
  },
  {
    id: "usr_mock_frank",
    name: "Frank Msigwa",
    email: "frank.msigwa@example.com",
    phone: "+255715345604",
    userType: "driver",
  },
  {
    id: "usr_mock_zawadi",
    name: "Zawadi Peter",
    email: "zawadi.peter@example.com",
    phone: "+255716345605",
    userType: "rider",
  },
  {
    id: "usr_mock_baraka",
    name: "Baraka John",
    email: "baraka.john@example.com",
    phone: "+255717345606",
    userType: "rider",
  },
  {
    id: "usr_mock_halima",
    name: "Halima Said",
    email: "halima.said@example.com",
    phone: "+255718345607",
    userType: "rider",
  },
  {
    id: "usr_mock_juma",
    name: "Juma Ally",
    email: "juma.ally@example.com",
    phone: "+255719345608",
    userType: "driver",
  },
  {
    id: "usr_mock_grace",
    name: "Grace Mushi",
    email: "grace.mushi@example.com",
    phone: "+255720345609",
    userType: "rider",
  },
  {
    id: "usr_mock_emmanuel",
    name: "Emmanuel Kessy",
    email: "emmanuel.kessy@example.com",
    phone: "+255721345610",
    userType: "driver",
  },
  {
    id: "usr_mock_rehema",
    name: "Rehema Msuya",
    email: "rehema.msuya@example.com",
    phone: "+255722345611",
    userType: "rider",
  },
  {
    id: "usr_mock_amina",
    name: "Amina Rajab",
    email: "amina.rajab@example.com",
    phone: "+255723345612",
    userType: "rider",
  },
  {
    id: "usr_mock_peter",
    name: "Peter Mwita",
    email: "peter.mwita@example.com",
    phone: "+255724345613",
    userType: "driver",
  },
  {
    id: "usr_mock_sofia",
    name: "Sofia Mkwawa",
    email: "sofia.mkwawa@example.com",
    phone: "+255725345614",
    userType: "rider",
  },
];

const REFERRAL_NAMES = [
  "Neema rider invite",
  "Joseph driver circle",
  "Asha weekend referrals",
  "Frank fleet invite",
  "Zawadi rider rewards",
  "Baraka new rider code",
  "Halima campus referrals",
  "Juma driver network",
  "Grace family invite",
  "Emmanuel driver rewards",
  "Rehema rider circle",
  "Amina neighbourhood invite",
  "Peter driver network",
  "Sofia rider referrals",
  "Neema city invite",
  "Joseph boda referrals",
  "Asha student referrals",
  "Frank driver invite",
  "Zawadi office referrals",
  "Baraka rider network",
  "Halima new rider invite",
  "Juma driver circle",
  "Grace campus invite",
  "Emmanuel fleet referrals",
  "Rehema community invite",
  "Amina rider rewards",
  "Peter driver referrals",
  "Sofia family invite",
  "Neema rider network",
  "Joseph driver invite",
];

const PENDING_INDEXES = new Set([2, 7, 12, 17, 22, 27]);
const EXPIRED_INDEXES = new Set([5, 15, 25]);
const INACTIVE_INDEXES = new Set([9, 19, 29]);
const REWARD_TYPES: ReferralRewardType[] = [
  "ride_credit",
  "cash_credit",
  "discount",
];

const seedReferralCodes = (): ReferralCode[] =>
  REFERRAL_NAMES.map((name, index) => {
    const assignedUser =
      MOCK_REFERRAL_USERS[index % MOCK_REFERRAL_USERS.length];
    const firstName = assignedUser.name.split(" ")[0].toUpperCase().slice(0, 6);
    const pendingReferrals = PENDING_INDEXES.has(index)
      ? 1 + (index % 3)
      : 0;
    const uses = PENDING_INDEXES.has(index)
      ? index % 5
      : EXPIRED_INDEXES.has(index)
        ? (index * 2) % 15
        : INACTIVE_INDEXES.has(index)
          ? index % 7
          : (index * 3) % 13;
    const referrerRewardTzs = assignedUser.userType === "driver" ? 5_000 : 2_000;
    const newUserRewardTzs = assignedUser.userType === "driver" ? 3_000 : 1_000;
    const expiryDate = dateKeyFromNow(
      EXPIRED_INDEXES.has(index) ? -8 - (index % 5) : 20 + (index % 40),
    );
    const storedStatus = INACTIVE_INDEXES.has(index) ? "inactive" : "active";
    const status = normalizeReferralStatus(
      storedStatus,
      expiryDate,
      pendingReferrals,
    );

    return {
      id: `ref_code_mock_${String(index + 1).padStart(2, "0")}`,
      name,
      code: `RAUT${firstName}${String(index + 1).padStart(2, "0")}`,
      assignedUserId: assignedUser.id,
      assignedUserName: assignedUser.name,
      assignedUserEmail: assignedUser.email,
      assignedUserPhone: assignedUser.phone,
      userType: assignedUser.userType,
      uses,
      pendingReferrals,
      maxUses: index % 4 === 0 ? 50 : 20,
      referrerRewardTzs,
      newUserRewardTzs,
      rewardType: REWARD_TYPES[index % REWARD_TYPES.length],
      rewardsTzs: uses * referrerRewardTzs,
      status,
      expiryDate,
      createdAt: daysFromNow(-index - 1),
    };
  });

let referralCodes: ReferralCode[] = seedReferralCodes();

const cloneCode = (code: ReferralCode): ReferralCode => ({ ...code });

const cloneUser = (user: ReferralAssignableUser): ReferralAssignableUser => ({
  ...user,
});

const matchesSearch = (values: Array<string | undefined>, search: string) => {
  const query = search.trim().toLowerCase();

  if (!query) return true;

  return values.some((value) => value?.toLowerCase().includes(query));
};

const statsFrom = (items: ReferralCode[]): ReferralCodeStats => ({
  totalCodes: items.length,
  assigned: items.filter((item) => item.assignedUserId).length,
  successfulReferrals: items.reduce((total, item) => total + item.uses, 0),
  rewardsPaidTzs: items.reduce((total, item) => total + item.rewardsTzs, 0),
});

export async function mockListReferralCodes(
  params: ReferralCodeListParams = {},
): Promise<ReferralCodeListResult> {
  await wait();

  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const status = params.status ?? "all";
  const type = params.type ?? "all";
  const from = params.from || "";
  const to = params.to || "";
  const filtered = referralCodes
    .filter((code) => {
      if (status !== "all" && code.status !== status) return false;
      if (type !== "all" && code.userType !== type) return false;

      const createdDate = code.createdAt.slice(0, 10);

      if (from && createdDate < from) return false;
      if (to && createdDate > to) return false;

      return matchesSearch(
        [
          code.code,
          code.name,
          code.assignedUserName,
          code.assignedUserEmail,
          code.assignedUserPhone,
        ],
        params.search ?? "",
      );
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const start = (page - 1) * limit;

  return {
    items: filtered.slice(start, start + limit).map(cloneCode),
    total: filtered.length,
    page,
    limit,
  };
}

export async function mockGetReferralCodeStats(): Promise<ReferralCodeStats> {
  await wait();

  return statsFrom(referralCodes);
}

export async function mockCreateReferralCode(
  payload: ReferralCodePayload,
): Promise<ReferralCode> {
  await wait();

  const code = payload.code.trim().toUpperCase();
  const existing = referralCodes.some(
    (item) => item.code.toLowerCase() === code.toLowerCase(),
  );

  if (existing) {
    throw new Error(`Referral code ${code} is already in use.`);
  }

  const assignedUser = MOCK_REFERRAL_USERS.find(
    (user) => user.id === payload.assigned_user_id,
  );

  if (!assignedUser) {
    throw new Error("Select a valid rider or driver.");
  }

  const createdAt = new Date().toISOString();
  const created: ReferralCode = {
    id: `ref_code_mock_${Date.now()}`,
    name: payload.name.trim(),
    code,
    assignedUserId: assignedUser.id,
    assignedUserName: assignedUser.name,
    assignedUserEmail: assignedUser.email,
    assignedUserPhone: assignedUser.phone,
    userType: payload.user_type || assignedUser.userType,
    uses: 0,
    pendingReferrals: 0,
    maxUses: payload.max_uses,
    referrerRewardTzs: payload.referrer_reward_tzs,
    newUserRewardTzs: payload.new_user_reward_tzs,
    rewardType: payload.reward_type,
    rewardsTzs: 0,
    status: normalizeReferralStatus(payload.status, payload.expiry_date, 0),
    expiryDate: payload.expiry_date,
    createdAt,
  };

  referralCodes = [created, ...referralCodes];

  return cloneCode(created);
}

export async function mockUpdateReferralCode(
  codeId: string,
  payload: ReferralCodeUpdatePayload,
): Promise<ReferralCode> {
  await wait();

  const current = referralCodes.find((item) => item.id === codeId);

  if (!current) {
    throw new Error("Referral code not found.");
  }

  const maxUses = payload.max_uses ?? current.maxUses;

  if (maxUses < current.uses) {
    throw new Error(
      `Maximum uses cannot be lower than the ${current.uses} completed use${current.uses === 1 ? "" : "s"}.`,
    );
  }

  const expiryDate = payload.expiry_date ?? current.expiryDate;
  const today = dateKeyFromNow(0);

  if (expiryDate.slice(0, 10) < today) {
    throw new Error("Expiry date cannot be in the past.");
  }

  const storedStatus = payload.status ?? referralStoredStatus(current);

  if (storedStatus === "active" && expiryDate.slice(0, 10) < today) {
    throw new Error("An expired referral code cannot be activated.");
  }

  const updated: ReferralCode = {
    ...current,
    maxUses,
    expiryDate,
    status: normalizeReferralStatus(
      storedStatus,
      expiryDate,
      current.pendingReferrals,
    ),
  };

  referralCodes = referralCodes.map((item) =>
    item.id === codeId ? updated : item,
  );

  return cloneCode(updated);
}

export async function mockDeleteReferralCode(codeId: string): Promise<void> {
  await wait();

  const current = referralCodes.find((item) => item.id === codeId);

  if (!current) {
    throw new Error("Referral code not found.");
  }

  if (
    current.status !== "expired" &&
    (current.uses > 0 || current.pendingReferrals > 0)
  ) {
    throw new Error(
      "Only expired or unused referral codes can be deleted.",
    );
  }

  referralCodes = referralCodes.filter((item) => item.id !== codeId);
}

export async function mockSendReferralCode(
  codeId: string,
  channel: ReferralSendChannel,
): Promise<void> {
  await wait(240);

  const current = referralCodes.find((item) => item.id === codeId);

  if (!current) {
    throw new Error("Referral code not found.");
  }

  if (channel === "sms" && !current.assignedUserPhone) {
    throw new Error("This user does not have a phone number.");
  }

  if (channel === "email" && !current.assignedUserEmail) {
    throw new Error("This user does not have an email address.");
  }
}

export async function mockSearchReferralUsers({
  search,
  userType,
  limit = 8,
}: {
  search: string;
  userType: ReferralUserType;
  limit?: number;
}) {
  await wait(120);

  const query = search.trim().toLowerCase();

  if (query.length < 2) return [];

  return MOCK_REFERRAL_USERS.filter(
    (user) =>
      user.userType === userType &&
      matchesSearch([user.name, user.email, user.phone], query),
  )
    .slice(0, limit)
    .map(cloneUser);
}
