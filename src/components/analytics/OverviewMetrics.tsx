import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AnalyticsCard } from "./AnalyticsCard";
import { ChartTooltip } from "./ChartTooltip";
import { axisProps, chartColors, gridProps } from "../../lib/chartTheme";
import { formatCount, formatMoney } from "../../services/mappers";
import type { AnalyticsOverview } from "../../types/index";

interface OverviewMetricsProps {
  overview: AnalyticsOverview;
  loading?: boolean;
  error?: any;
  onRetry?: () => void;
}

const METRICS: Array<{
  key: keyof AnalyticsOverview;
  label: string;
  money?: boolean;
}> = [
  { key: "total_users", label: "Total users" },
  { key: "total_drivers", label: "Total drivers" },
  { key: "verified_drivers", label: "Verified drivers" },
  { key: "pending_drivers", label: "Pending drivers" },
  { key: "rejected_drivers", label: "Rejected drivers" },
  { key: "suspended_drivers", label: "Suspended drivers" },
  { key: "active_rides_now", label: "Active rides now" },
  { key: "active_routes_now", label: "Active routes now" },
  { key: "rides_today", label: "Rides today" },
  { key: "rides_this_week", label: "Rides this week" },
  { key: "rides_this_month", label: "Rides this month" },
  { key: "completed_rides_today", label: "Completed today" },
  { key: "completed_rides_this_week", label: "Completed this week" },
  { key: "completed_rides_this_month", label: "Completed this month" },
  { key: "revenue_today_tzs", label: "Revenue today", money: true },
  { key: "revenue_this_week_tzs", label: "Revenue this week", money: true },
  { key: "revenue_this_month_tzs", label: "Revenue this month", money: true },
  { key: "pending_payouts_count", label: "Pending payouts" },
  {
    key: "pending_payouts_amount_tzs",
    label: "Pending payout amount",
    money: true,
  },
  { key: "pending_documents_count", label: "Pending documents" },
];

const COMPOSITION: Array<{ key: keyof AnalyticsOverview; label: string }> = [
  { key: "total_users", label: "Users" },
  { key: "total_drivers", label: "Drivers" },
  { key: "verified_drivers", label: "Verified drivers" },
  { key: "pending_drivers", label: "Pending drivers" },
  { key: "active_routes_now", label: "Active routes" },
  { key: "active_rides_now", label: "Active rides" },
  { key: "pending_payouts_count", label: "Pending payouts" },
  { key: "pending_documents_count", label: "Pending documents" },
];

const num = (value: unknown) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
};

export function OverviewMetrics({
  overview,
  loading,
  error,
  onRetry,
}: OverviewMetricsProps) {
  const chartData = COMPOSITION.map((item) => ({
    label: item.label,
    value: num(overview[item.key]),
  }));
  const hasChartData = chartData.some((item) => item.value > 0);

  const metrics = METRICS.filter(
    (metric) =>
      overview[metric.key] !== undefined && overview[metric.key] !== null,
  );

  return (
    <AnalyticsCard
      title="Platform overview"
      subtitle="Users, drivers, live activity and pending work"
      badge="Live snapshot"
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={metrics.length === 0}
      emptyMessage="No overview metrics available."
      height={240}
    >
      <div className="space-y-6">
        <div
          role="img"
          aria-label="Platform counts for users, drivers, active routes and rides, and pending work"
        >
          {hasChartData ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
              >
                <CartesianGrid {...gridProps} horizontal={false} />
                <XAxis type="number" {...axisProps} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="label"
                  {...axisProps}
                  width={112}
                />
                <Tooltip
                  content={
                    <ChartTooltip formatter={(value) => formatCount(value)} />
                  }
                />
                <Bar
                  dataKey="value"
                  name="Total"
                  fill={chartColors.slate900}
                  radius={[0, 4, 4, 0]}
                  maxBarSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div
              className="flex flex-col items-center justify-center gap-2 text-center"
              style={{ height: 240 }}
            >
              <p className="text-sm text-slate-500">
                No platform activity to chart yet.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div
              key={metric.key}
              className="rounded-xl border border-slate-100 bg-slate-50/40 p-3.5"
            >
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                {metric.label}
              </p>
              <p className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                {metric.money
                  ? formatMoney(overview[metric.key])
                  : formatCount(overview[metric.key])}
              </p>
            </div>
          ))}
        </div>
      </div>
    </AnalyticsCard>
  );
}
