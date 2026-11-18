/**
 * Analytics domain types for the admin dashboard: backend snake_case rows and
 * the normalized camelCase series/stat shapes consumed by charts. Monetary
 * values are in TZS unless a field name says otherwise.
 */

/** Time bucket used to group analytics series. */
export type AnalyticsPeriod = 'day' | 'week' | 'month'
/** Alias for callers that name the bucket a granularity. */
export type AnalyticsGranularity = AnalyticsPeriod
/** Quick date-range selector shown in the analytics toolbar. */
export type AnalyticsPreset = '7d' | '30d' | '90d' | 'custom'

/**
 * Fully resolved analytics date range.
 * `start`/`end` are the Date objects used for calculations, while
 * `startStr`/`endStr` are their formatted equivalents sent to the backend.
 * `daysBack` is the lookback length used to size the fetch window.
 */
export interface AnalyticsRange {
  preset: AnalyticsPreset
  granularity: AnalyticsGranularity
  start: Date
  end: Date
  daysBack: number
  startStr: string
  endStr: string
}

/**
 * Previous-period window used for comparison metrics.
 * `previousStart`/`previousEnd` mirror the main range shifted back by the same
 * length, and `fetchDays` is the total history window requested so both
 * periods arrive in one call. `reason` is null when no comparison is shown.
 */
export interface AnalyticsComparisonWindow {
  enabled: boolean
  previousStart: Date
  previousEnd: Date
  previousStartStr: string
  previousEndStr: string
  fetchDays: number
  reason: string | null
}

/** Comparison deltas for rides and revenue, layered on the window metadata. */
export interface AnalyticsComparison extends AnalyticsComparisonWindow {
  rides: {
    total: MetricDelta
    completed: MetricDelta
    cancelled: MetricDelta
    fare: MetricDelta
  }
  revenue: {
    totalRevenue: MetricDelta
    platformFees: MetricDelta
    driverEarnings: MetricDelta
    transactions: MetricDelta
  }
}

/**
 * Change between the current and previous period.
 * `delta` is `current - previous`; `deltaPct` is the percentage change and is
 * null when a percentage is undefined (for example, previous value is zero).
 */
export interface MetricDelta {
  current: number
  previous: number
  delta: number
  deltaPct: number | null
}

/**
 * Aggregate counters from the dashboard overview endpoint.
 * All fields are optional because endpoints and roles expose different
 * subsets. Fields ending in `_tzs` are monetary amounts in Tanzanian
 * shillings; `active_routes_now` / `active_rides_now` are live counts.
 */
export interface AnalyticsOverview {
  total_users?: number
  total_drivers?: number
  verified_drivers?: number
  pending_drivers?: number
  rejected_drivers?: number
  suspended_drivers?: number
  active_routes_now?: number
  active_rides_now?: number
  rides_today?: number
  rides_this_week?: number
  rides_this_month?: number
  completed_rides_today?: number
  completed_rides_this_week?: number
  completed_rides_this_month?: number
  revenue_today_tzs?: number
  revenue_this_week_tzs?: number
  revenue_this_month_tzs?: number
  pending_payouts_count?: number
  pending_payouts_amount_tzs?: number
  pending_documents_count?: number
  [key: string]: unknown
}

/**
 * Backend row for the rides series. The same value can arrive under multiple
 * aliases (`total_fare_tzs` or `total_fare`, `completed_rides` or
 * `completed`); normalization picks whichever is present. Distances are in
 * metres and monetary values in TZS.
 */
export interface AnalyticsRidesRow {
  period_start?: string
  date?: string
  day?: string
  total_rides?: number
  rides?: number
  completed_rides?: number
  completed?: number
  cancelled_rides?: number
  cancelled?: number
  rejected_rides?: number
  rejected?: number
  total_fare_tzs?: number
  total_fare?: number
  total_platform_fee_tzs?: number
  platform_fee_tzs?: number
  avg_fare_tzs?: number
  avg_fare?: number
  avg_distance_m?: number
  avg_distance?: number
  [key: string]: unknown
}

/**
 * Backend row for the revenue series, again allowing alias pairs
 * (`total_revenue_tzs` / `total_revenue` / `revenue` / `amount`).
 * All monetary fields are TZS; `transaction_count` counts payment events.
 */
export interface AnalyticsRevenueRow {
  period_start?: string
  date?: string
  day?: string
  total_revenue_tzs?: number
  total_revenue?: number
  revenue?: number
  amount?: number
  platform_fees_tzs?: number
  platform_fees?: number
  driver_earnings_tzs?: number
  driver_earnings?: number
  payouts_tzs?: number
  payouts?: number
  transaction_count?: number
  transactions?: number
  [key: string]: unknown
}

/**
 * Driver counters from the analytics endpoint. Status fields appear under
 * both short (`verified`) and suffixed (`verified_drivers`) names, and
 * `*_this_week` fields are scoped to the current week.
 */
export interface AnalyticsDrivers {
  total_drivers?: number
  drivers?: number
  verified?: number
  verified_drivers?: number
  pending?: number
  pending_drivers?: number
  suspended?: number
  suspended_drivers?: number
  inactive?: number
  rejected?: number
  new_drivers?: number
  registered_this_week?: number
  verified_this_week?: number
  pending_documents?: number
  drivers_with_complete_docs?: number
  active_drivers_today?: number
  drivers_with_active_routes?: number
  [key: string]: unknown
}

/**
 * Backend row for the peak-hours histogram. `hour_of_day` / `hour` is 0-23;
 * `period` / `time` may carry a formatted label instead. Monetary fields are
 * TZS and `*_count` fields are ride counts.
 */
export interface AnalyticsPeakHourRow {
  hour_of_day?: number
  hour?: number
  period?: string
  time?: string
  ride_count?: number
  total_rides?: number
  rides?: number
  count?: number
  avg_fare_tzs?: number
  avg_fare?: number
  total_revenue_tzs?: number
  total_revenue?: number
  [key: string]: unknown
}

/**
 * Normalized rides chart point.
 * `period` is the bucket start and `label` its display text. `fare`,
 * `platformFee` and `avgFare` are TZS; `avgDistance` is in metres.
 */
export interface RidesPoint {
  period: string
  label: string
  total: number
  completed: number
  cancelled: number
  rejected: number
  fare: number
  platformFee: number
  avgFare: number
  avgDistance: number
}

/** Normalized revenue chart point; all monetary fields are TZS. */
export interface RevenuePoint {
  period: string
  label: string
  totalRevenue: number
  platformFees: number
  driverEarnings: number
  payouts: number
  transactions: number
}

/**
 * Normalized peak-hour point.
 * `hour` is 0-23, `label` is the display text, and `avgFare` / `revenue` are
 * TZS amounts aggregated for that hour.
 */
export interface PeakHourPoint {
  hour: number
  label: string
  rides: number
  avgFare: number
  revenue: number
}

/** Normalized driver counters used by the drivers analytics cards. */
export interface DriverStats {
  totalDrivers: number
  verified: number
  pending: number
  rejected: number
  suspended: number
  registeredThisWeek: number
  verifiedThisWeek: number
  pendingDocuments: number
  completeDocs: number
  activeToday: number
  activeRoutes: number
}

/**
 * Wrapper distinguishing a multi-bucket series from a single latest value.
 * `latest` is the most recent point (or null when no data was returned).
 */
export interface AnalyticsSeries<T> {
  isSeries: boolean
  points: T[]
  latest: T | null
}

/**
 * Display-ready stat card values. `value` and `delta` are preformatted
 * strings; `up` indicates whether the delta should be styled as positive.
 */
export interface DashboardStat {
  label: string
  value: string
  delta: string
  up: boolean
  hint: string
}
