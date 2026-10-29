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
  [key: string]: unknown
}

export interface AnalyticsRevenueRow {
  period_start?: string
  date?: string
  day?: string
  total_revenue?: number
  revenue?: number
  total_revenue_tzs?: number
  amount?: number
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
  [key: string]: unknown
}

export interface AnalyticsPeakHourRow {
  hour?: number
  period?: string
  time?: string
  total_rides?: number
  rides?: number
  count?: number
  [key: string]: unknown
}
