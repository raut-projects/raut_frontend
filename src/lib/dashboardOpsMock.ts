import type {
  DashboardAlert,
  DashboardHealthService,
  DashboardMetricDelta,
  DashboardStats,
  HourlyRevenuePoint,
} from "@/types/dashboardOps";
import { deterministicNumber, stableHash } from "./liveRides";

const MOCK_FARES = [4500, 6200, 3800, 7500, 5200];

let eventTick = 0;
let mockStats: DashboardStats | null = null;

const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60_000).toISOString();

const delta = (
  value: number,
  label: string,
  direction: "up" | "down" | "flat",
): DashboardMetricDelta => ({ value, label, direction });

const baseStats = (): DashboardStats => ({
  activeRides: 38,
  activeRidesDelta: delta(6, "vs yesterday", "up"),
  todayRevenue: 1_284_500,
  todayRevenueDelta: delta(12.4, "vs yesterday", "up"),
  onlineDrivers: 126,
  onlineDriversDelta: delta(9, "vs yesterday", "up"),
  urgentIssues: 3,
  updatedAt: new Date().toISOString(),
});

export function getMockDashboardStats(): DashboardStats {
  const stats = mockStats ?? baseStats();
  mockStats = stats;
  return { ...stats };
}

export function nextMockStatsUpdate(stats: DashboardStats): DashboardStats {
  eventTick += 1;
  const step = eventTick % 5;
  const next: DashboardStats = {
    ...stats,
    activeRides: Math.max(0, stats.activeRides + (step % 2 === 0 ? 1 : -1)),
    todayRevenue: stats.todayRevenue + MOCK_FARES[step],
    onlineDrivers: Math.max(0, stats.onlineDrivers + (step === 3 ? -1 : 1)),
    urgentIssues: Math.max(
      0,
      stats.urgentIssues + (step === 2 ? -1 : step === 4 ? 1 : 0),
    ),
    activeRidesDelta: {
      ...stats.activeRidesDelta,
      value: deterministicNumber(`rides-${eventTick}`, 2, 9),
    },
    updatedAt: new Date().toISOString(),
  };
  mockStats = next;
  return next;
}

export function nextMockCompletedRevenue(amount: number): number {
  eventTick += 1;
  const fare = MOCK_FARES[eventTick % MOCK_FARES.length];
  if (mockStats) {
    mockStats = {
      ...mockStats,
      todayRevenue: mockStats.todayRevenue + fare,
      activeRides: Math.max(0, mockStats.activeRides - 1),
      updatedAt: new Date().toISOString(),
    };
  }
  return amount + fare;
}

export function nextMockDriverCount(count: number): number {
  eventTick += 1;
  const change = eventTick % 3 === 0 ? -1 : 1;
  const next = Math.max(0, count + change);
  if (mockStats) {
    mockStats = { ...mockStats, onlineDrivers: next };
  }
  return next;
}

export function getMockHourlyRevenue(): HourlyRevenuePoint[] {
  const currentHour = new Date().getHours();
  return Array.from({ length: currentHour + 1 }, (_, hour) => {
    const base = 28_000 + (stableHash(`hourly-revenue-${hour}`) % 58_000);
    const peak = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20) ? 2 : 1;
    return {
      hour: `${String(hour).padStart(2, "0")}:00`,
      amount: Math.round((base * peak) / 100) * 100,
    };
  });
}

export function getMockDashboardAlerts(): DashboardAlert[] {
  return [
    {
      id: "alert-driver-approval-1",
      type: "driver_approval",
      priority: "critical",
      title: "3 driver approvals waiting",
      description:
        "Driver documents have been submitted and need verification before activation.",
      href: "/drivers?status=pending",
      actionLabel: "Review approvals",
      createdAt: minutesAgo(4),
    },
    {
      id: "alert-ride-dispute-1",
      type: "ride_dispute",
      priority: "high",
      title: "Ride dispute needs review",
      description:
        "A customer disputed the final fare for a completed ride in Kariakoo.",
      href: "/rides?tab=disputes",
      actionLabel: "Open dispute",
      createdAt: minutesAgo(11),
    },
    {
      id: "alert-payment-failure-1",
      type: "payment_failure",
      priority: "high",
      title: "M-Pesa collection failed",
      description:
        "A payment callback did not settle; the transaction is pending reconciliation.",
      href: "/transactions?status=failed",
      actionLabel: "Inspect payment",
      createdAt: minutesAgo(18),
    },
    {
      id: "alert-system-health-1",
      type: "system_health",
      priority: "critical",
      title: "SMS delivery below threshold",
      description:
        "SMS gateway success rate dropped below 80% over the last 15 minutes.",
      href: "/settings/system-health",
      actionLabel: "Check services",
      createdAt: minutesAgo(23),
    },
    {
      id: "alert-payout-batch-1",
      type: "payout_batch",
      priority: "medium",
      title: "Payout batch ready for review",
      description: "42 driver payouts are queued for the next settlement run.",
      href: "/payouts/batch",
      actionLabel: "Review batch",
      createdAt: minutesAgo(41),
    },
    {
      id: "alert-ticket-1",
      type: "ticket",
      priority: "medium",
      title: "Support ticket escalated",
      description: "An unresolved rider ticket was escalated to the operations queue.",
      href: "/support-tickets",
      actionLabel: "Open ticket",
      createdAt: minutesAgo(68),
    },
    {
      id: "alert-promotion-1",
      type: "promotion",
      priority: "low",
      title: "Promotion ends today",
      description: "The weekend ride discount is scheduled to expire at midnight.",
      href: "/marketing/promotions",
      actionLabel: "View promotion",
      createdAt: minutesAgo(145),
    },
  ];
}

const NEW_ALERT_TYPES: DashboardAlert["type"][] = [
  "driver_approval",
  "ride_dispute",
  "payment_failure",
  "system_health",
  "payout_batch",
  "ticket",
  "promotion",
];

const NEW_ALERT_PRIORITIES: DashboardAlert["priority"][] = [
  "critical",
  "high",
  "high",
  "critical",
  "medium",
  "medium",
  "low",
];

export function nextMockDashboardAlert(): DashboardAlert {
  eventTick += 1;
  const index = eventTick % NEW_ALERT_TYPES.length;
  const type = NEW_ALERT_TYPES[index];
  return {
    id: `alert-${type}-${Date.now()}-${eventTick}`,
    type,
    priority: NEW_ALERT_PRIORITIES[index],
    title: `New ${type.replace(/_/g, " ")} alert`,
    description: "A new operational alert requires your attention.",
    href: getMockDashboardAlerts()[index]?.href ?? "/",
    actionLabel: "View details",
    createdAt: new Date().toISOString(),
  };
}

const API_LATENCY_THRESHOLD_MS = 200;
const SMS_SUCCESS_THRESHOLD_PCT = 80;
const PAYMENT_SUCCESS_THRESHOLD_PCT = 95;

export function getMockHealthServices(): DashboardHealthService[] {
  const apiLatencyMs = 142;
  const smsSuccessPct = 76.4;
  const paymentSuccessPct = 97.8;

  return [
    {
      id: "api",
      name: "API",
      status: apiLatencyMs > API_LATENCY_THRESHOLD_MS ? "degraded" : "healthy",
      metricLabel: "Response time",
      metricValue: `${apiLatencyMs} ms`,
    },
    {
      id: "postgresql",
      name: "PostgreSQL",
      status: "healthy",
      metricLabel: "Connections",
      metricValue: "32 / 100",
    },
    {
      id: "redis",
      name: "Redis",
      status: "healthy",
      metricLabel: "Hit rate",
      metricValue: "98.6%",
    },
    {
      id: "sms-gateway",
      name: "SMS Gateway",
      status:
        smsSuccessPct < SMS_SUCCESS_THRESHOLD_PCT ? "degraded" : "healthy",
      metricLabel: "Delivery rate",
      metricValue: `${smsSuccessPct.toFixed(1)}%`,
    },
    {
      id: "mpesa-payment",
      name: "M-Pesa Payment",
      status:
        paymentSuccessPct < PAYMENT_SUCCESS_THRESHOLD_PCT
          ? "degraded"
          : "healthy",
      metricLabel: "Success rate",
      metricValue: `${paymentSuccessPct.toFixed(1)}%`,
    },
    {
      id: "firebase-push",
      name: "Firebase Push",
      status: "healthy",
      metricLabel: "Delivery rate",
      metricValue: "99.2%",
    },
    {
      id: "minio-storage",
      name: "MinIO Storage",
      status: "healthy",
      metricLabel: "Disk usage",
      metricValue: "64%",
    },
  ];
}
