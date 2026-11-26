export type DashboardMetricDirection = "up" | "down" | "flat"

export interface DashboardMetricDelta {
  value: number
  label: string
  direction: DashboardMetricDirection
}

export interface DashboardStats {
  activeRides: number
  activeRidesDelta: DashboardMetricDelta
  todayRevenue: number
  todayRevenueDelta: DashboardMetricDelta
  onlineDrivers: number
  onlineDriversDelta: DashboardMetricDelta
  urgentIssues: number
  updatedAt: string
}

export type DashboardAlertType =
  | "driver_approval"
  | "ride_dispute"
  | "payment_failure"
  | "system_health"
  | "payout_batch"
  | "ticket"
  | "promotion"

export type DashboardAlertPriority = "critical" | "high" | "medium" | "low"

export interface DashboardAlert {
  id: string
  type: DashboardAlertType
  priority: DashboardAlertPriority
  title: string
  description: string
  href: string
  actionLabel: string
  createdAt: string
}

export interface HourlyRevenuePoint {
  hour: string
  amount: number
}

export type HealthServiceState = "healthy" | "degraded" | "unhealthy"

export interface DashboardHealthService {
  id: string
  name: string
  status: HealthServiceState
  metricLabel: string
  metricValue: string
}
