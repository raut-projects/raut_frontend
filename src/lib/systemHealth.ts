export type HealthStatus = "healthy" | "degraded" | "outage";
export type JobStatus = "healthy" | "delayed" | "attention";
export type IncidentStatus = "Investigating" | "Monitoring" | "Resolved";
export type HealthPeriod = "24h" | "7d" | "30d";

export type HealthService = {
  id: string;
  name: string;
  description: string;
  region: string;
  status: HealthStatus;
  uptimePercent: number;
  latencyMs: number;
};

export type HealthTrendPoint = {
  label: string;
  latencyMs: number;
  availabilityPercent: number;
};

export type HealthJob = {
  id: string;
  name: string;
  description: string;
  status: JobStatus;
  lastRun: string;
  duration: string;
  note: string;
};

export type HealthIncident = {
  id: string;
  title: string;
  service: string;
  status: IncidentStatus;
  severity: "Minor" | "Major";
  startedAt: string;
  duration: string;
  summary: string;
};

export const HEALTH_SAMPLED_AT = "2026-11-10T14:15:00+03:00";

// These records are illustrative samples and are not live platform telemetry.
export const MOCK_HEALTH_SERVICES: HealthService[] = [
  {
    id: "api-gateway",
    name: "API gateway",
    description: "Public and admin API requests",
    region: "Dar es Salaam",
    status: "healthy",
    uptimePercent: 99.99,
    latencyMs: 84,
  },
  {
    id: "primary-database",
    name: "Primary database",
    description: "Transactional data and account records",
    region: "Dar es Salaam",
    status: "healthy",
    uptimePercent: 99.98,
    latencyMs: 21,
  },
  {
    id: "authentication",
    name: "Authentication",
    description: "Sign-in, sessions and token refresh",
    region: "Dar es Salaam",
    status: "healthy",
    uptimePercent: 99.97,
    latencyMs: 106,
  },
  {
    id: "payments",
    name: "Payment provider",
    description: "Mobile money collection and payouts",
    region: "East Africa",
    status: "degraded",
    uptimePercent: 99.82,
    latencyMs: 642,
  },
  {
    id: "ride-dispatch",
    name: "Ride dispatch",
    description: "Driver matching and trip assignment",
    region: "Dar es Salaam",
    status: "healthy",
    uptimePercent: 99.96,
    latencyMs: 134,
  },
  {
    id: "notifications",
    name: "Notifications",
    description: "SMS, push and in-app delivery",
    region: "East Africa",
    status: "healthy",
    uptimePercent: 99.91,
    latencyMs: 209,
  },
  {
    id: "job-queue",
    name: "Background queue",
    description: "Scheduled and asynchronous tasks",
    region: "Dar es Salaam",
    status: "healthy",
    uptimePercent: 99.95,
    latencyMs: 49,
  },
  {
    id: "object-storage",
    name: "Document storage",
    description: "Driver documents and uploaded assets",
    region: "East Africa",
    status: "healthy",
    uptimePercent: 99.99,
    latencyMs: 72,
  },
];

export const HEALTH_PERIODS: Array<{ value: HealthPeriod; label: string }> = [
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
];

export const MOCK_HEALTH_TRENDS: Record<HealthPeriod, HealthTrendPoint[]> = {
  "24h": [
    { label: "02:00", latencyMs: 92, availabilityPercent: 99.98 },
    { label: "04:00", latencyMs: 88, availabilityPercent: 99.99 },
    { label: "06:00", latencyMs: 96, availabilityPercent: 99.97 },
    { label: "08:00", latencyMs: 128, availabilityPercent: 99.96 },
    { label: "10:00", latencyMs: 171, availabilityPercent: 99.95 },
    { label: "12:00", latencyMs: 356, availabilityPercent: 99.91 },
    { label: "13:00", latencyMs: 642, availabilityPercent: 99.82 },
    { label: "14:00", latencyMs: 418, availabilityPercent: 99.94 },
  ],
  "7d": [
    { label: "Nov 04", latencyMs: 104, availabilityPercent: 99.97 },
    { label: "Nov 05", latencyMs: 112, availabilityPercent: 99.98 },
    { label: "Nov 06", latencyMs: 109, availabilityPercent: 99.97 },
    { label: "Nov 07", latencyMs: 124, availabilityPercent: 99.96 },
    { label: "Nov 08", latencyMs: 117, availabilityPercent: 99.98 },
    { label: "Nov 09", latencyMs: 281, availabilityPercent: 99.92 },
    { label: "Nov 10", latencyMs: 418, availabilityPercent: 99.94 },
  ],
  "30d": [
    { label: "Oct 12", latencyMs: 119, availabilityPercent: 99.96 },
    { label: "Oct 15", latencyMs: 123, availabilityPercent: 99.97 },
    { label: "Oct 18", latencyMs: 115, availabilityPercent: 99.98 },
    { label: "Oct 21", latencyMs: 128, availabilityPercent: 99.95 },
    { label: "Oct 24", latencyMs: 121, availabilityPercent: 99.97 },
    { label: "Oct 27", latencyMs: 132, availabilityPercent: 99.96 },
    { label: "Oct 30", latencyMs: 146, availabilityPercent: 99.94 },
    { label: "Nov 02", latencyMs: 138, availabilityPercent: 99.97 },
    { label: "Nov 06", latencyMs: 212, availabilityPercent: 99.93 },
    { label: "Nov 10", latencyMs: 418, availabilityPercent: 99.94 },
  ],
};

export const MOCK_HEALTH_JOBS: HealthJob[] = [
  {
    id: "payout-reconciliation",
    name: "Payout reconciliation",
    description: "Matches mobile money transfers to driver balances",
    status: "healthy",
    lastRun: "Today, 14:00 EAT",
    duration: "18 sec",
    note: "Completed successfully",
  },
  {
    id: "notification-retry",
    name: "Notification retry queue",
    description: "Retries temporarily undelivered messages",
    status: "delayed",
    lastRun: "Today, 13:55 EAT",
    duration: "2 min",
    note: "12 messages waiting for retry",
  },
  {
    id: "driver-document-expiry",
    name: "Driver document expiry scan",
    description: "Checks upcoming licence and insurance expiries",
    status: "healthy",
    lastRun: "Today, 13:30 EAT",
    duration: "41 sec",
    note: "Completed successfully",
  },
  {
    id: "analytics-rollup",
    name: "Daily analytics rollup",
    description: "Aggregates ride, revenue and driver activity",
    status: "healthy",
    lastRun: "Today, 12:00 EAT",
    duration: "1 min 12 sec",
    note: "Completed successfully",
  },
  {
    id: "ride-summary-cache",
    name: "Ride summary cache refresh",
    description: "Refreshes dashboard ride summary data",
    status: "attention",
    lastRun: "Today, 11:45 EAT",
    duration: "—",
    note: "Last run failed; next retry scheduled",
  },
];

export const MOCK_HEALTH_INCIDENTS: HealthIncident[] = [
  {
    id: "inc_20261110_payments",
    title: "Mobile money response times elevated",
    service: "Payment provider",
    status: "Monitoring",
    severity: "Major",
    startedAt: "Today, 13:04 EAT",
    duration: "1h 11m",
    summary:
      "A payment partner is responding more slowly than usual. Requests continue to complete, with some payouts taking longer to confirm.",
  },
  {
    id: "inc_20261108_notifications",
    title: "SMS delivery delays",
    service: "Notifications",
    status: "Resolved",
    severity: "Minor",
    startedAt: "Nov 08, 09:12 EAT",
    duration: "26m",
    summary:
      "A temporary carrier queue delay affected a portion of outgoing customer notifications.",
  },
  {
    id: "inc_20261102_database",
    title: "Database connection pool saturation",
    service: "Primary database",
    status: "Resolved",
    severity: "Major",
    startedAt: "Nov 02, 16:40 EAT",
    duration: "14m",
    summary:
      "A short traffic spike exhausted available connections. Capacity was restored and queued requests recovered.",
  },
  {
    id: "inc_20261027_dispatch",
    title: "Ride assignment queue backlog",
    service: "Ride dispatch",
    status: "Resolved",
    severity: "Minor",
    startedAt: "Oct 27, 18:05 EAT",
    duration: "19m",
    summary:
      "A worker restart briefly slowed new driver assignments in the Dar es Salaam service area.",
  },
];

export const HEALTH_STATUS_LABELS: Record<HealthStatus, string> = {
  healthy: "Operational",
  degraded: "Degraded",
  outage: "Outage",
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  healthy: "Healthy",
  delayed: "Delayed",
  attention: "Needs attention",
};
