import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AnalyticsCard } from "./AnalyticsCard";
import { ChartTooltip } from "./ChartTooltip";
import { ComparisonBadge } from "./ComparisonBadge";
import {
  axisProps,
  chartColors,
  chartHeight,
  chartMargin,
  gridProps,
} from "../../lib/chartTheme";
import {
  formatCompactMoney,
  formatCount,
  formatMoney,
} from "../../services/mappers";
import type {
  AnalyticsComparison,
  AnalyticsSeries,
  MetricDelta,
  RevenuePoint,
} from "../../types/index";

interface RevenueChartProps {
  series: AnalyticsSeries<RevenuePoint>;
  previous?: AnalyticsSeries<RevenuePoint> | null;
  comparison?: AnalyticsComparison | null;
  loading?: boolean;
  error?: any;
  onRetry?: () => void;
}

function StatChip({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: MetricDelta | null;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <div className="mt-0.5 flex items-center gap-1.5">
        <p className="text-sm font-semibold text-slate-900">{value}</p>
        <ComparisonBadge delta={delta} />
      </div>
    </div>
  );
}

export function RevenueChart({
  series,
  previous,
  comparison,
  loading,
  error,
  onRetry,
}: RevenueChartProps) {
  const { points, latest } = series;
  const singlePoint = points.length <= 1;
  const hasPrevious = Boolean(previous?.points.length);
  const previousOffset = hasPrevious
    ? (previous?.points.length ?? 0) - points.length
    : 0;
  const chartData = points.map((point, index) => ({
    ...point,
    previousTotalRevenue:
      previous?.points[index + previousOffset]?.totalRevenue ?? null,
  }));

  const empty = points.length === 0;

  const footer = latest ? (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatChip
        label="Revenue"
        value={formatMoney(latest.totalRevenue)}
        delta={comparison?.revenue.totalRevenue}
      />
      <StatChip
        label="Platform fees"
        value={formatMoney(latest.platformFees)}
        delta={comparison?.revenue.platformFees}
      />
      <StatChip
        label="Driver earnings"
        value={formatMoney(latest.driverEarnings)}
        delta={comparison?.revenue.driverEarnings}
      />
      <StatChip
        label="Transactions"
        value={formatCount(latest.transactions)}
        delta={comparison?.revenue.transactions}
      />
    </div>
  ) : null;

  return (
    <AnalyticsCard
      title="Revenue analytics"
      subtitle="Revenue by period"
      badge={singlePoint ? "Current period" : "Series"}
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={empty}
      emptyMessage="No revenue recorded for this period."
      height={chartHeight}
      footer={footer}
    >
      <div
        role="img"
        aria-label="Revenue per period, split between platform fees and driver earnings"
      >
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart data={chartData} margin={chartMargin}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="label" {...axisProps} minTickGap={20} />
            <YAxis
              {...axisProps}
              width={58}
              tickFormatter={formatCompactMoney}
            />
            <Tooltip
              content={
                <ChartTooltip formatter={(value) => formatMoney(value)} />
              }
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, color: chartColors.slate500 }}
            />
            <Line
              dataKey="totalRevenue"
              name="Total revenue"
              type="monotone"
              stroke={chartColors.slate900}
              strokeWidth={2.5}
              dot={singlePoint ? { r: 3 } : false}
            />
            <Line
              dataKey="platformFees"
              name="Platform fees"
              type="monotone"
              stroke={chartColors.violet}
              strokeWidth={2}
              dot={singlePoint ? { r: 2.5 } : false}
            />
            <Line
              dataKey="driverEarnings"
              name="Driver earnings"
              type="monotone"
              stroke={chartColors.sky}
              strokeWidth={2}
              dot={singlePoint ? { r: 2.5 } : false}
            />
            {hasPrevious && (
              <Line
                dataKey="previousTotalRevenue"
                name="Previous revenue"
                type="monotone"
                stroke={chartColors.slate400}
                strokeDasharray="5 4"
                strokeWidth={1.5}
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </AnalyticsCard>
  );
}
