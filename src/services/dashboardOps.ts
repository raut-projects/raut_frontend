import { API_ROUTES, DASHBOARD_USE_MOCK_DATA } from "@/lib/config";
import {
  getMockDashboardAlerts,
  getMockDashboardStats,
  getMockHealthServices,
  getMockHourlyRevenue,
} from "@/lib/dashboardOpsMock";
import type {
  DashboardAlert,
  DashboardAlertPriority,
  DashboardAlertType,
  DashboardHealthService,
  DashboardMetricDelta,
  DashboardMetricDirection,
  DashboardStats,
  HealthServiceState,
  HourlyRevenuePoint,
} from "@/types/dashboardOps";
import { apiGet } from "./api";

const ALERT_TYPES: DashboardAlertType[] = [
  "driver_approval",
  "ride_dispute",
  "payment_failure",
  "system_health",
  "payout_batch",
  "ticket",
  "promotion",
];

const ALERT_PRIORITIES: DashboardAlertPriority[] = [
  "critical",
  "high",
  "medium",
  "low",
];

const HEALTH_STATES: HealthServiceState[] = [
  "healthy",
  "degraded",
  "unhealthy",
];

const unwrap = (payload: any): any => {
  let value = payload;
  let guard = 0;
  while (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "data" in value &&
    guard < 3
  ) {
    value = value.data;
    guard += 1;
  }
  return value;
};

const asObject = (payload: any): Record<string, any> => {
  const value = unwrap(payload);
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
};

const pick = (obj: any, keys: string[]): any => {
  if (!obj || typeof obj !== "object") return undefined;
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return undefined;
};

const asRows = (payload: any, keys: string[]): any[] => {
  const value = unwrap(payload);
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  for (const key of keys) {
    if (Array.isArray(value[key])) return value[key];
  }
  return [];
};

const toNumber = (value: any, fallback = 0): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const asString = (value: any, fallback: string): string => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const directionOf = (value: number): DashboardMetricDirection =>
  value > 0 ? "up" : value < 0 ? "down" : "flat";

const mapDelta = (value: any, fallbackLabel: string): DashboardMetricDelta => {
  if (typeof value === "number") {
    return { value, label: fallbackLabel, direction: directionOf(value) };
  }
  const row = asObject(value);
  const num = toNumber(pick(row, ["value", "delta", "change", "percent"]));
  const rawDirection = asString(
    pick(row, ["direction", "trend"]),
    "",
  ).toLowerCase();
  const direction: DashboardMetricDirection =
    rawDirection === "up" || rawDirection === "positive"
      ? "up"
      : rawDirection === "down" || rawDirection === "negative"
        ? "down"
        : rawDirection === "flat"
          ? "flat"
          : directionOf(num);
  return {
    value: num,
    label: asString(pick(row, ["label", "text"]), fallbackLabel),
    direction,
  };
};

const mapAlert = (row: any): DashboardAlert | null => {
  const alert = asObject(row);
  const id = asString(pick(alert, ["id", "alert_id", "alertId"]), "");
  if (!id) return null;
  const type = asString(pick(alert, ["type", "alert_type"]), "ticket");
  const priority = asString(pick(alert, ["priority", "severity"]), "medium");
  return {
    id,
    type: ALERT_TYPES.includes(type as DashboardAlertType)
      ? (type as DashboardAlertType)
      : "ticket",
    priority: ALERT_PRIORITIES.includes(priority as DashboardAlertPriority)
      ? (priority as DashboardAlertPriority)
      : "medium",
    title: asString(pick(alert, ["title", "message"]), "Dashboard alert"),
    description: asString(pick(alert, ["description", "detail", "body"]), ""),
    href: asString(pick(alert, ["href", "url", "link"]), "/"),
    actionLabel: asString(
      pick(alert, ["action_label", "actionLabel", "cta_label"]),
      "View details",
    ),
    createdAt: asString(
      pick(alert, ["created_at", "createdAt", "timestamp"]),
      new Date().toISOString(),
    ),
  };
};

const mapHourlyPoint = (row: any): HourlyRevenuePoint | null => {
  const point = asObject(row);
  const hour = pick(point, ["hour", "label", "time", "period"]);
  if (hour === undefined) return null;
  return {
    hour: asString(hour, ""),
    amount: toNumber(
      pick(point, ["amount", "revenue", "total", "total_revenue", "value"]),
    ),
  };
};

const mapHealthState = (value: any, fallback: HealthServiceState): HealthServiceState => {
  const raw = asString(value, "").toLowerCase();
  if (raw === "healthy" || raw === "ok" || raw === "up" || raw === "operational") {
    return "healthy";
  }
  if (raw === "degraded" || raw === "warning" || raw === "warn" || raw === "partial") {
    return "degraded";
  }
  if (raw === "unhealthy" || raw === "down" || raw === "outage" || raw === "error") {
    return "unhealthy";
  }
  return HEALTH_STATES.includes(raw as HealthServiceState)
    ? (raw as HealthServiceState)
    : fallback;
};

const mapHealthService = (row: any): DashboardHealthService | null => {
  const service = asObject(row);
  const metrics = asObject(pick(service, ["metrics", "metric"]));
  const name = asString(
    pick(service, ["name", "service_name", "serviceName"]),
    "Service",
  );
  return {
    id: asString(
      pick(service, ["id", "service_id", "serviceId"]),
      name.toLowerCase().replace(/\s+/g, "-"),
    ),
    name,
    status: mapHealthState(
      pick(service, ["status", "state", "health"]),
      "healthy",
    ),
    metricLabel: asString(
      pick(service, ["metric_label", "metricLabel", "metric_name"]) ??
        pick(metrics, ["label", "name"]),
      "Metric",
    ),
    metricValue: asString(
      pick(service, ["metric_value", "metricValue", "value"]) ??
        pick(metrics, ["value", "display"]),
      "—",
    ),
  };
};

export async function getDashboardStats({
  signal,
}: { signal?: AbortSignal } = {}): Promise<DashboardStats> {
  if (DASHBOARD_USE_MOCK_DATA) return getMockDashboardStats();
  const payload = await apiGet(API_ROUTES.dashboardStats, { signal });
  const data = asObject(pick(asObject(payload), ["stats", "summary"])) ??
    asObject(payload);
  const fallback = getMockDashboardStats();
  return {
    activeRides: toNumber(
      pick(data, ["active_rides", "activeRides"]),
      fallback.activeRides,
    ),
    activeRidesDelta: mapDelta(
      pick(data, ["active_rides_delta", "activeRidesDelta"]),
      fallback.activeRidesDelta.label,
    ),
    todayRevenue: toNumber(
      pick(data, ["today_revenue", "todayRevenue", "revenue_today"]),
      fallback.todayRevenue,
    ),
    todayRevenueDelta: mapDelta(
      pick(data, ["today_revenue_delta", "todayRevenueDelta"]),
      fallback.todayRevenueDelta.label,
    ),
    onlineDrivers: toNumber(
      pick(data, ["online_drivers", "onlineDrivers"]),
      fallback.onlineDrivers,
    ),
    onlineDriversDelta: mapDelta(
      pick(data, ["online_drivers_delta", "onlineDriversDelta"]),
      fallback.onlineDriversDelta.label,
    ),
    urgentIssues: toNumber(
      pick(data, ["urgent_issues", "urgentIssues"]),
      fallback.urgentIssues,
    ),
    updatedAt: asString(
      pick(data, ["updated_at", "updatedAt"]),
      fallback.updatedAt,
    ),
  };
}

export async function getDashboardAlerts({
  signal,
}: { signal?: AbortSignal } = {}): Promise<DashboardAlert[]> {
  if (DASHBOARD_USE_MOCK_DATA) return getMockDashboardAlerts();
  const payload = await apiGet(API_ROUTES.dashboardAlerts, { signal });
  return asRows(payload, ["alerts", "items", "results"])
    .map(mapAlert)
    .filter((alert): alert is DashboardAlert => Boolean(alert));
}

export async function getHourlyRevenue(
  date: string = "today",
  { signal }: { signal?: AbortSignal } = {},
): Promise<HourlyRevenuePoint[]> {
  if (DASHBOARD_USE_MOCK_DATA) return getMockHourlyRevenue();
  const payload = await apiGet(API_ROUTES.analyticsRevenueHourly, {
    params: { date },
    signal,
  });
  return asRows(payload, ["points", "hours", "revenue", "items", "results"])
    .map(mapHourlyPoint)
    .filter((point): point is HourlyRevenuePoint => Boolean(point))
    .sort((a, b) => a.hour.localeCompare(b.hour));
}

export async function getHealthServices({
  signal,
}: { signal?: AbortSignal } = {}): Promise<DashboardHealthService[]> {
  if (DASHBOARD_USE_MOCK_DATA) return getMockHealthServices();
  const payload = await apiGet(API_ROUTES.healthServices, { signal });
  return asRows(payload, ["services", "items", "results"])
    .map(mapHealthService)
    .filter((service): service is DashboardHealthService => Boolean(service));
}
