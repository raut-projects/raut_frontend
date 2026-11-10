"use client";

import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  Server,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AnalyticsCard } from "@/components/analytics/AnalyticsCard";
import { ChartTooltip } from "@/components/analytics/ChartTooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  axisProps,
  chartColors,
  chartMargin,
  gridProps,
} from "@/lib/chartTheme";
import {
  HEALTH_PERIODS,
  HEALTH_SAMPLED_AT,
  HEALTH_STATUS_LABELS,
  JOB_STATUS_LABELS,
  MOCK_HEALTH_INCIDENTS,
  MOCK_HEALTH_JOBS,
  MOCK_HEALTH_SERVICES,
  MOCK_HEALTH_TRENDS,
  type HealthPeriod,
  type HealthService,
  type HealthStatus,
  type IncidentStatus,
  type JobStatus,
} from "@/lib/systemHealth";

const serviceStatusStyles: Record<HealthStatus, string> = {
  healthy: "bg-emerald-50 text-emerald-800",
  degraded: "bg-amber-50 text-amber-800",
  outage: "bg-rose-50 text-rose-800",
};

const jobStatusStyles: Record<JobStatus, string> = {
  healthy: "bg-emerald-50 text-emerald-800",
  delayed: "bg-amber-50 text-amber-800",
  attention: "bg-rose-50 text-rose-800",
};

const incidentStatusStyles: Record<IncidentStatus, string> = {
  Investigating: "bg-rose-50 text-rose-800",
  Monitoring: "bg-amber-50 text-amber-800",
  Resolved: "bg-slate-100 text-slate-600",
};

const serviceIcons: Record<string, typeof Server> = {
  "api-gateway": Server,
  "primary-database": Database,
  authentication: ShieldCheck,
  payments: Activity,
  "ride-dispatch": Workflow,
  notifications: Activity,
  "job-queue": Workflow,
  "object-storage": Database,
};

const periodSubtitle: Record<HealthPeriod, string> = {
  "24h": "Sampled across the last 24 hours",
  "7d": "Daily samples across the last 7 days",
  "30d": "Sampled across the last 30 days",
};

const formatSampleTime = (value: string) =>
  new Intl.DateTimeFormat("en-TZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Dar_es_Salaam",
  }).format(new Date(value));

function StatusBadge({ status }: { status: HealthStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${serviceStatusStyles[status]}`}
    >
      <span
        className={`size-1.5 rounded-full ${
          status === "healthy"
            ? "bg-emerald-500"
            : status === "degraded"
              ? "bg-amber-500"
              : "bg-rose-500"
        }`}
        aria-hidden="true"
      />
      {HEALTH_STATUS_LABELS[status]}
    </span>
  );
}

function ServiceHealthTable({ services }: { services: HealthService[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Service health
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Current sample status and rolling 30-day service metrics.
          </p>
        </div>
        <p className="text-xs text-slate-500">
          {services.filter((service) => service.status === "healthy").length} of{" "}
          {services.length} operational
        </p>
      </div>

      <Table>
        <TableHeader className="bg-slate-50 [&_tr]:border-slate-200">
          <TableRow className="hover:bg-transparent">
            <TableHead>Service</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Latency</TableHead>
            <TableHead className="hidden text-right sm:table-cell">
              Uptime · 30d
            </TableHead>
            <TableHead className="hidden text-right lg:table-cell">
              Region
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service) => {
            const Icon = serviceIcons[service.id] ?? Server;

            return (
              <TableRow key={service.id}>
                <TableCell className="whitespace-normal">
                  <div className="flex min-w-44 items-start gap-3">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium text-slate-800">
                        {service.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {service.description}
                      </span>
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={service.status} />
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums text-slate-700">
                  {service.latencyMs} ms
                </TableCell>
                <TableCell className="hidden text-right font-medium tabular-nums text-slate-700 sm:table-cell">
                  {service.uptimePercent.toFixed(2)}%
                </TableCell>
                <TableCell className="hidden text-right text-xs text-slate-500 lg:table-cell">
                  {service.region}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function LatencyChart({ period }: { period: HealthPeriod }) {
  const data = MOCK_HEALTH_TRENDS[period];

  return (
    <AnalyticsCard
      title="API latency"
      subtitle={periodSubtitle[period]}
      badge="ms"
      height={220}
    >
      <div
        role="img"
        aria-label={`Illustrative API latency trend for ${periodSubtitle[period]}`}
      >
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={chartMargin}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="label" {...axisProps} minTickGap={18} />
            <YAxis
              {...axisProps}
              width={42}
              tickFormatter={(value: number) => `${value} ms`}
            />
            <Tooltip
              content={
                <ChartTooltip
                  formatter={(value) => `${Math.round(Number(value))} ms`}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="latencyMs"
              name="Latency"
              stroke={chartColors.sky}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </AnalyticsCard>
  );
}

function AvailabilityChart({ period }: { period: HealthPeriod }) {
  const data = MOCK_HEALTH_TRENDS[period];

  return (
    <AnalyticsCard
      title="Service availability"
      subtitle={periodSubtitle[period]}
      badge="%"
      height={220}
    >
      <div
        role="img"
        aria-label={`Illustrative service availability trend for ${periodSubtitle[period]}`}
      >
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={chartMargin}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="label" {...axisProps} minTickGap={18} />
            <YAxis
              {...axisProps}
              width={54}
              domain={[99.7, 100]}
              tickFormatter={(value: number) => `${Number(value).toFixed(2)}%`}
            />
            <Tooltip
              content={
                <ChartTooltip
                  formatter={(value) => `${Number(value).toFixed(2)}%`}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="availabilityPercent"
              name="Availability"
              stroke={chartColors.emerald}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </AnalyticsCard>
  );
}

function SystemHealthPage() {
  const [period, setPeriod] = useState<HealthPeriod>("24h");
  const healthyServices = MOCK_HEALTH_SERVICES.filter(
    (service) => service.status === "healthy",
  ).length;
  const healthyJobs = MOCK_HEALTH_JOBS.filter(
    (job) => job.status === "healthy",
  ).length;
  const averageUptime =
    MOCK_HEALTH_SERVICES.reduce(
      (total, service) => total + service.uptimePercent,
      0,
    ) / MOCK_HEALTH_SERVICES.length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            System Health
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Service availability, performance, background jobs and recent
            incidents.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
          <Clock3 className="size-3.5 text-slate-400" aria-hidden="true" />
          Sample snapshot · {formatSampleTime(HEALTH_SAMPLED_AT)} EAT
        </span>
      </header>

      <section
        aria-label="Overall system status"
        className="rounded-xl border border-amber-200 bg-white px-4 py-4 sm:px-5"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700">
              <AlertTriangle className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                Overall status
              </p>
              <h3 className="mt-0.5 text-lg font-semibold text-slate-900">
                Degraded performance
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                Payment provider response times are elevated. Core API,
                authentication and ride dispatch samples remain operational.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-slate-200 pt-3 lg:min-w-[27rem] lg:border-t-0 lg:border-l lg:pt-0 lg:pl-5">
            <div>
              <p className="text-xs font-medium text-slate-500">Services</p>
              <p className="mt-1 text-base font-semibold tabular-nums text-slate-900">
                {healthyServices}/{MOCK_HEALTH_SERVICES.length}
              </p>
              <p className="text-xs text-slate-500">operational</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">30-day uptime</p>
              <p className="mt-1 text-base font-semibold tabular-nums text-slate-900">
                {averageUptime.toFixed(2)}%
              </p>
              <p className="text-xs text-slate-500">service average</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Jobs healthy</p>
              <p className="mt-1 text-base font-semibold tabular-nums text-slate-900">
                {healthyJobs}/{MOCK_HEALTH_JOBS.length}
              </p>
              <p className="text-xs text-slate-500">latest sample</p>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Performance trends" className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Performance trends
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Select a period to change both illustrative trend charts.
            </p>
          </div>
          <div
            role="group"
            aria-label="Select trend period"
            className="inline-flex w-fit rounded-lg border border-slate-200 bg-white p-1"
          >
            {HEALTH_PERIODS.map((option) => {
              const selected = option.value === period;

              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setPeriod(option.value)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 ${
                    selected
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <LatencyChart period={period} />
          <AvailabilityChart period={period} />
        </div>
      </section>

      <ServiceHealthTable services={MOCK_HEALTH_SERVICES} />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
          <div className="flex items-end justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Background jobs
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Latest example runs from scheduled platform work.
              </p>
            </div>
            <Workflow
              className="size-4 shrink-0 text-slate-400"
              aria-hidden="true"
            />
          </div>
          <Table>
            <TableHeader className="bg-slate-50 [&_tr]:border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead>Job</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden text-right sm:table-cell">
                  Last run
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_HEALTH_JOBS.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="whitespace-normal">
                    <span className="block font-medium text-slate-800">
                      {job.name}
                    </span>
                    <span className="mt-0.5 block max-w-sm text-xs leading-5 text-slate-500">
                      {job.description}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500 sm:hidden">
                      {job.lastRun} · {job.duration}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold ${jobStatusStyles[job.status]}`}
                    >
                      {JOB_STATUS_LABELS[job.status]}
                    </span>
                    <span className="mt-1 block max-w-48 text-xs leading-5 text-slate-500">
                      {job.note}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-right sm:table-cell">
                    <span className="block text-xs font-medium text-slate-700">
                      {job.lastRun}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {job.duration}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
          <div className="flex items-end justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Recent incidents
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Illustrative service events and their current state.
              </p>
            </div>
            <CheckCircle2
              className="size-4 shrink-0 text-slate-400"
              aria-hidden="true"
            />
          </div>
          <ol className="divide-y divide-slate-100">
            {MOCK_HEALTH_INCIDENTS.map((incident) => (
              <li key={incident.id} className="px-4 py-4 sm:px-5">
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${
                      incident.status === "Resolved"
                        ? "bg-slate-300"
                        : incident.severity === "Major"
                          ? "bg-rose-500"
                          : "bg-amber-500"
                    }`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-900">
                        {incident.title}
                      </h4>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${incidentStatusStyles[incident.status]}`}
                      >
                        {incident.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-600">
                      {incident.service} · {incident.severity} · {incident.startedAt}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {incident.summary}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      Duration: {incident.duration}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}

export default SystemHealthPage;
