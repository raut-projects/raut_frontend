export const PEAK_HOUR_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type PeakHourDay = (typeof PEAK_HOUR_DAYS)[number];

export type PeakHourSlot = {
  day: PeakHourDay;
  start: string;
  end: string;
};

export type PeakHourSlotDraft = PeakHourSlot & {
  id: string;
  enabled: boolean;
};

export type PricingConfig = {
  base_fare_tzs: number;
  price_per_km_tzs: number;
  price_per_minute_tzs: number;
  platform_fee_percent: number;
  peak_hour_surge_percent: number;
  duo_discount_percent: number;
  duo_distribution_percent: number;
  peak_hours: PeakHourSlot[];
};

export type PricingDraft = {
  base_fare_tzs: string;
  price_per_km_tzs: string;
  price_per_minute_tzs: string;
  platform_fee_percent: string;
  peak_hour_surge_percent: string;
  duo_discount_percent: string;
  duo_distribution_percent: string;
  peak_hours: PeakHourSlotDraft[];
};

export type FeatureFlags = {
  scheduled_rides: boolean;
  duo: boolean;
  ratings: boolean;
  in_app_chat: boolean;
  corporate_accounts: boolean;
};

export type AutoPayoutSchedule = "weekly" | "biweekly" | "monthly";

export type OperationsConfig = {
  min_payout_amount_tzs: number;
  auto_payout_schedule: AutoPayoutSchedule;
  document_expiry_reminder_days: number;
  max_concurrent_requests: number;
  request_timeout_seconds: number;
  session_token_expiry_minutes: number;
};

export type OperationsDraft = {
  min_payout_amount_tzs: string;
  auto_payout_schedule: AutoPayoutSchedule;
  document_expiry_reminder_days: string;
  max_concurrent_requests: string;
  request_timeout_seconds: string;
  session_token_expiry_minutes: string;
};

export type IntegrationStatusKey =
  | "connected"
  | "degraded"
  | "disconnected";

export type Integration = {
  key: string;
  name: string;
  status: IntegrationStatusKey;
  identifier: string;
  identifier_label: string;
  docs_url?: string;
};

export type IntegrationTestResult = {
  status: IntegrationStatusKey;
  message: string;
  latency_ms?: number;
};

export type ConfigHistoryEntry = {
  id: string | number;
  created_at: string;
  admin_name: string;
  admin_role: string;
  field: string;
  old_value: string | number | boolean | null;
  new_value: string | number | boolean | null;
  note?: string | null;
};

export type ConfigHistoryPagination = {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
};

export type ConfigHistoryResponse = {
  items: ConfigHistoryEntry[];
  pagination: ConfigHistoryPagination;
};

export type FieldErrors = Record<string, string>;

export type FareBreakdown = {
  base: number;
  distance: number;
  time: number;
  subtotal: number;
  surge: number;
  total: number;
};
