export type ReferralJsonPrimitive = string | number | boolean | null;

export type ReferralJsonValue =
  | ReferralJsonPrimitive
  | ReferralJsonValue[]
  | { [key: string]: ReferralJsonValue };

export type ReferralJsonObject = Record<string, ReferralJsonValue>;

export type ReferralProgram = ReferralJsonObject & {
  id: string;
  name: string;
};

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

export type ReferralProgramUpdatePayload =
  Partial<ReferralProgramPayload>;

export type ReferralProgramListParams = {
  active_only?: boolean;
};

export type ReferralUsersParams = {
  limit?: number;
  offset?: number;
};

export type ReferralRelationshipsParams = ReferralUsersParams & {
  status?: "completed" | "pending";
};

export type ReferralUser = ReferralJsonObject & {
  user_id: string;
};

export type ReferralRelationship = ReferralJsonObject & {
  referral_id: string;
};

export type ReferralEnrollment = ReferralJsonObject & {
  id: string;
  program_id: string;
  user_id: string;
};

export type ReferralBulkEnrollmentResult = ReferralJsonObject & {
  message: string;
  success: number;
  failed: number;
};

export type ReferralStats = {
  total_referrals: number;
  successful_referrals: number;
  pending_referrals: number;
  total_rewards_paid: number;
  total_rewards_pending: number;
  top_referrer_count: number;
};

export type ReferralStatsParams = {
  period?: string;
};

export type ReferralTopReferrer = ReferralJsonObject & {
  user_id: string;
  user_name: string;
};

export type ReferralPendingPayment = ReferralJsonObject & {
  id: string;
  amount_tzs: number;
};

export type ReferralPaymentPayload = {
  payment_id: string;
  transaction_id?: string;
};

export type ReferralMyCode = ReferralJsonObject & {
  referral_code: string;
};

export type ProcessReferralPayload = {
  referral_code: string;
  referee_id?: string;
  referee_type: "rider" | "driver";
};
