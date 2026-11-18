// Referral API types. Describes programs, users, relationships, enrollments,
// stats and payments exchanged with the backend referral endpoints. Payloads
// use snake_case to match the API, and several types extend a permissive JSON
// object so unknown server fields survive round-trips.

/** JSON scalar accepted in referral payloads. */
export type ReferralJsonPrimitive = string | number | boolean | null;

/** Recursive JSON value used for loosely-typed referral data. */
export type ReferralJsonValue =
  | ReferralJsonPrimitive
  | ReferralJsonValue[]
  | { [key: string]: ReferralJsonValue };

/** Object of JSON values, used as an extensible base for referral types. */
export type ReferralJsonObject = Record<string, ReferralJsonValue>;

/** A referral program as returned by the API. */
export type ReferralProgram = ReferralJsonObject & {
  id: string;
  name: string;
};

/** Fields accepted when creating a referral program. */
export type ReferralProgramPayload = {
  name: string;
  description?: string;
  is_default?: boolean;
  reward_config: ReferralJsonValue;
  target_referee_type?: "rider" | "driver" | null;
  max_referrals_per_user?: number | null;
  reward_expiry_days?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  priority?: number;
  is_active?: boolean;
};

/** Fields accepted when updating a referral program (all optional). */
export type ReferralProgramUpdatePayload =
  Partial<ReferralProgramPayload>;

/** Query parameters for listing referral programs. */
export type ReferralProgramListParams = {
  active_only?: boolean;
};

/** Pagination parameters shared by referral list endpoints. */
export type ReferralUsersParams = {
  limit?: number;
  offset?: number;
};

/** Parameters for listing referral relationships, with an optional status filter. */
export type ReferralRelationshipsParams = ReferralUsersParams & {
  status?: "completed" | "pending";
};

/** A referred user record. */
export type ReferralUser = ReferralJsonObject & {
  user_id: string;
};

/** A referral relationship between referrer and referee. */
export type ReferralRelationship = ReferralJsonObject & {
  referral_id: string;
};

/** A user's enrollment in a referral program. */
export type ReferralEnrollment = ReferralJsonObject & {
  id: string;
  program_id: string;
  user_id: string;
};

/** Result of a bulk enrollment request, including success and failure counts. */
export type ReferralBulkEnrollmentResult = ReferralJsonObject & {
  message: string;
  success: number;
  failed: number;
};

/** Aggregate referral statistics shown on the referrals dashboard. */
export type ReferralStats = {
  total_referrals: number;
  successful_referrals: number;
  pending_referrals: number;
  total_rewards_paid: number;
  total_rewards_pending: number;
  top_referrer_count: number;
};

/** Parameters for referral stats, e.g. a period filter. */
export type ReferralStatsParams = {
  period?: string;
};

/** A top referrer entry in the referral leaderboard. */
export type ReferralTopReferrer = ReferralJsonObject & {
  user_id: string;
  user_name: string;
};

/** A pending referral reward payment. `amount_tzs` is in Tanzanian shillings. */
export type ReferralPendingPayment = ReferralJsonObject & {
  id: string;
  amount_tzs: number;
};

/** Payload for marking a referral payment as paid. */
export type ReferralPaymentPayload = {
  payment_id: string;
  transaction_id?: string;
};

/** The current user's own referral code. */
export type ReferralMyCode = ReferralJsonObject & {
  referral_code: string;
};

/** Payload for processing a referral code against a referee. */
export type ProcessReferralPayload = {
  referral_code: string;
  referee_id?: string;
  referee_type: "rider" | "driver";
};
