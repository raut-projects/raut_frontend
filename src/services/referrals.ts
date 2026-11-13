// Referral program service.
// Manages referral programs, enrollments, relationships, stats and payouts
// through the shared `./api` helpers. Responses are validated strictly and
// surface as ApiError on request failure or TypeError on malformed data.

import { API_ROUTES } from "@/lib/config";
import type {
  ProcessReferralPayload,
  ReferralBulkEnrollmentResult,
  ReferralEnrollment,
  ReferralJsonObject,
  ReferralJsonValue,
  ReferralMyCode,
  ReferralPendingPayment,
  ReferralPaymentPayload,
  ReferralProgram,
  ReferralProgramListParams,
  ReferralProgramPayload,
  ReferralProgramUpdatePayload,
  ReferralRelationship,
  ReferralRelationshipsParams,
  ReferralStats,
  ReferralStatsParams,
  ReferralTopReferrer,
  ReferralUser,
  ReferralUsersParams,
} from "@/lib/referrals";
import { apiDelete, apiGet, apiPost, apiPut } from "./api";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toJsonValue(
  value: unknown,
  label: string,
  seen = new WeakSet<object>(),
): ReferralJsonValue {
  if (value === null) return null;

  if (typeof value === "string" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError(`${label} must contain only finite numbers.`);
    }

    return value;
  }

  if (Array.isArray(value)) {
    if (seen.has(value)) {
      throw new TypeError(`${label} must not contain circular references.`);
    }

    seen.add(value);
    const result = value.map((item, index) =>
      toJsonValue(item, `${label}[${index}]`, seen),
    );
    seen.delete(value);

    return result;
  }

  if (isRecord(value)) {
    if (seen.has(value)) {
      throw new TypeError(`${label} must not contain circular references.`);
    }

    seen.add(value);
    const result: ReferralJsonObject = {};
    Object.entries(value).forEach(([key, item]) => {
      result[key] = toJsonValue(item, `${label}.${key}`, seen);
    });
    seen.delete(value);

    return result;
  }

  throw new TypeError(`${label} must contain only JSON-safe values.`);
}

function asObject(value: unknown, label: string): ReferralJsonObject {
  const json = toJsonValue(value, label);

  if (json === null || typeof json !== "object" || Array.isArray(json)) {
    throw new TypeError(`${label} response must be an object.`);
  }

  return json;
}

function responseObject(
  value: unknown,
  wrappers: string[],
  label: string,
): ReferralJsonObject {
  const record = asObject(value, label);

  for (const wrapper of wrappers) {
    const wrapped = record[wrapper];
    if (wrapped !== null && typeof wrapped === "object" && !Array.isArray(wrapped)) {
      return wrapped;
    }
  }

  return record;
}

function responseArray(
  value: unknown,
  wrappers: string[],
  label: string,
): ReferralJsonValue[] {
  const json = toJsonValue(value, label);

  if (Array.isArray(json)) return json;

  if (json !== null && typeof json === "object") {
    for (const wrapper of wrappers) {
      const wrapped = json[wrapper];
      if (Array.isArray(wrapped)) return wrapped;
    }
  }

  throw new TypeError(`${label} response must be an array.`);
}

function requiredString(
  record: ReferralJsonObject,
  key: string,
  label: string,
): string {
  const value = record[key];
  if (typeof value !== "string" || !value) {
    throw new TypeError(`${label} response is missing "${key}".`);
  }

  return value;
}

function requiredNumber(
  record: ReferralJsonObject,
  key: string,
  label: string,
): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${label} response is missing a valid "${key}".`);
  }

  return value;
}

function mapReferralProgram(value: unknown): ReferralProgram {
  const record = asObject(value, "Referral program");

  return {
    ...record,
    id: requiredString(record, "id", "Referral program"),
    name: requiredString(record, "name", "Referral program"),
  };
}

function mapReferralEnrollment(value: unknown): ReferralEnrollment {
  const record = asObject(value, "Referral enrollment");

  return {
    ...record,
    id: requiredString(record, "id", "Referral enrollment"),
    program_id: requiredString(record, "program_id", "Referral enrollment"),
    user_id: requiredString(record, "user_id", "Referral enrollment"),
  };
}

function mapReferralUser(value: unknown): ReferralUser {
  const record = asObject(value, "Referral user");

  return {
    ...record,
    user_id: requiredString(record, "user_id", "Referral user"),
  };
}

function mapReferralRelationship(value: unknown): ReferralRelationship {
  const record = asObject(value, "Referral relationship");

  return {
    ...record,
    referral_id: requiredString(record, "referral_id", "Referral relationship"),
  };
}

function mapTopReferrer(value: unknown): ReferralTopReferrer {
  const record = asObject(value, "Top referrer");

  return {
    ...record,
    user_id: requiredString(record, "user_id", "Top referrer"),
    user_name: requiredString(record, "user_name", "Top referrer"),
  };
}

function mapPendingPayment(value: unknown): ReferralPendingPayment {
  const record = asObject(value, "Pending referral payment");

  return {
    ...record,
    id: requiredString(record, "id", "Pending referral payment"),
    amount_tzs: requiredNumber(record, "amount_tzs", "Pending referral payment"),
  };
}

export async function createReferralProgram(
  payload: ReferralProgramPayload,
): Promise<ReferralProgram> {
  const body = {
    ...payload,
    reward_config: toJsonValue(payload.reward_config, "reward_config"),
  };
  const data = await apiPost(API_ROUTES.referralPrograms, body);

  return mapReferralProgram(
    responseObject(data, ["program", "referral_program"], "Referral program"),
  );
}

export async function listReferralPrograms(
  params: ReferralProgramListParams = {},
): Promise<ReferralProgram[]> {
  const data = await apiGet(API_ROUTES.referralPrograms, { params });

  return responseArray(data, ["programs", "items"], "Referral programs").map(
    mapReferralProgram,
  );
}

export async function getReferralProgram(
  programId: string,
): Promise<ReferralProgram> {
  const data = await apiGet(API_ROUTES.referralProgram(programId));

  return mapReferralProgram(
    responseObject(data, ["program", "referral_program"], "Referral program"),
  );
}

export async function updateReferralProgram(
  programId: string,
  payload: ReferralProgramUpdatePayload,
): Promise<ReferralJsonValue> {
  const body =
    payload.reward_config === undefined
      ? payload
      : {
          ...payload,
          reward_config: toJsonValue(payload.reward_config, "reward_config"),
        };
  const data = await apiPut(API_ROUTES.referralProgram(programId), body);

  return toJsonValue(data, "Referral program update response");
}

export async function enrollReferralUser(
  programId: string,
  userId: string,
): Promise<ReferralEnrollment> {
  const query = new URLSearchParams({ user_id: userId });
  const data = await apiPost(
    `${API_ROUTES.referralProgramEnroll(programId)}?${query.toString()}`,
  );

  return mapReferralEnrollment(
    responseObject(data, ["enrollment"], "Referral enrollment"),
  );
}

export async function bulkEnrollReferralUsers(
  programId: string,
  userIds: string[],
): Promise<ReferralBulkEnrollmentResult> {
  const data = await apiPost(API_ROUTES.referralProgramBulkEnroll(programId), {
    user_ids: userIds,
  });
  const record = responseObject(data, ["result"], "Bulk referral enrollment");

  return {
    ...record,
    message: requiredString(record, "message", "Bulk referral enrollment"),
    success: requiredNumber(record, "success", "Bulk referral enrollment"),
    failed: requiredNumber(record, "failed", "Bulk referral enrollment"),
  };
}

export async function unenrollReferralUser(
  programId: string,
  userId: string,
): Promise<void> {
  await apiDelete(API_ROUTES.referralProgramUserEnrollment(programId, userId));
}

export async function listReferralUsers(
  params: ReferralUsersParams = {},
): Promise<ReferralUser[]> {
  const data = await apiGet(API_ROUTES.referralUsers, { params });

  return responseArray(data, ["users", "items"], "Referral users").map(
    mapReferralUser,
  );
}

export async function getReferralUser(userId: string): Promise<ReferralUser> {
  const data = await apiGet(API_ROUTES.referralUser(userId));

  return mapReferralUser(
    responseObject(data, ["user", "referral_user"], "Referral user"),
  );
}

export async function listReferralRelationships(
  params: ReferralRelationshipsParams = {},
): Promise<ReferralRelationship[]> {
  const data = await apiGet(API_ROUTES.referralRelationships, { params });

  return responseArray(
    data,
    ["relationships", "items"],
    "Referral relationships",
  ).map(mapReferralRelationship);
}

export async function getReferralStats(
  params: ReferralStatsParams = {},
): Promise<ReferralStats> {
  const data = await apiGet(API_ROUTES.referralStats, { params });
  const record = responseObject(data, ["stats"], "Referral stats");

  return {
    total_referrals: requiredNumber(record, "total_referrals", "Referral stats"),
    successful_referrals: requiredNumber(
      record,
      "successful_referrals",
      "Referral stats",
    ),
    pending_referrals: requiredNumber(
      record,
      "pending_referrals",
      "Referral stats",
    ),
    total_rewards_paid: requiredNumber(
      record,
      "total_rewards_paid",
      "Referral stats",
    ),
    total_rewards_pending: requiredNumber(
      record,
      "total_rewards_pending",
      "Referral stats",
    ),
    top_referrer_count: requiredNumber(
      record,
      "top_referrer_count",
      "Referral stats",
    ),
  };
}

export async function listTopReferrers(
  limit?: number,
): Promise<ReferralTopReferrer[]> {
  const data = await apiGet(API_ROUTES.referralTopReferrers, {
    params: { limit },
  });

  return responseArray(data, ["top_referrers", "referrers", "items"], "Top referrers")
    .map(mapTopReferrer);
}

export async function listPendingReferralPayments(): Promise<
  ReferralPendingPayment[]
> {
  const data = await apiGet(API_ROUTES.referralPendingPayments);

  return responseArray(
    data,
    ["pending_payments", "payments", "items"],
    "Pending referral payments",
  ).map(mapPendingPayment);
}

export async function markReferralPaymentPaid(
  paymentId: string,
  payload: ReferralPaymentPayload,
): Promise<ReferralJsonValue> {
  const data = await apiPost(
    API_ROUTES.referralPaymentPay(paymentId),
    payload,
  );

  return toJsonValue(data, "Referral payment response");
}

export async function getMyReferralCode(): Promise<ReferralMyCode> {
  const data = await apiGet(API_ROUTES.myReferralCode);
  const record = responseObject(data, ["code", "my_code"], "Referral code");

  return {
    ...record,
    referral_code: requiredString(record, "referral_code", "Referral code"),
  };
}

export async function processReferral(
  payload: ProcessReferralPayload,
): Promise<ReferralJsonValue> {
  const data = await apiPost(API_ROUTES.processReferral, payload);

  return toJsonValue(data, "Process referral response");
}
