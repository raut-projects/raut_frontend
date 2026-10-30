export type AnalyticsPeriod = 'day' | 'week' | 'month'

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

export interface RevenuePoint {
  period: string
  label: string
  totalRevenue: number
  platformFees: number
  driverEarnings: number
  payouts: number
  transactions: number
}

export interface PeakHourPoint {
  hour: number
  label: string
  rides: number
  avgFare: number
  revenue: number
}

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

export interface AnalyticsSeries<T> {
  isSeries: boolean
  points: T[]
  latest: T | null
}

export interface DashboardStat {
  label: string
  value: string
  delta: string
  up: boolean
  hint: string
}
