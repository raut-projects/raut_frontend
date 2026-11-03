import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
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
  formatCount,
  formatDistance,
  formatMoney,
} from "../../services/mappers";
import type {
  AnalyticsComparison,
  AnalyticsSeries,
  MetricDelta,
  RidesPoint,
} from "../../types/index";

interface RidesChartProps {
  series: AnalyticsSeries<RidesPoint>;
  previous?: AnalyticsSeries<RidesPoint> | null;
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

export function RidesChart({
  series,
  previous,
  comparison,
  loading,
  error,
  onRetry,
}: RidesChartProps) {
  const { points, latest } = series;
  const singlePoint = points.length <= 1;
  const hasPrevious = Boolean(previous?.points.length);
  const previousOffset = hasPrevious
    ? (previous?.points.length ?? 0) - points.length
    : 0;
  const chartData = points.map((point, index) => ({
    ...point,
    previousTotal: previous?.points[index + previousOffset]?.total ?? null,
  }));

  const empty = points.length === 0;

  const footer = latest ? (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatChip
        label="Total rides"
        value={formatCount(latest.total)}
        delta={comparison?.rides.total}
      />
      <StatChip
        label="Total fare"
        value={formatMoney(latest.fare)}
        delta={comparison?.rides.fare}
      />
      <StatChip label="Avg fare" value={formatMoney(latest.avgFare)} />
      <StatChip
        label="Avg distance"
        value={formatDistance(latest.avgDistance)}
      />
    </div>
  ) : null;

  return (
    <AnalyticsCard
      title="Rides analytics"
      subtitle="Rides by period"
      badge={singlePoint ? "Current period" : "Series"}
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={empty}
      emptyMessage="No rides recorded for this period."
      height={chartHeight}
      footer={footer}
    >
      <div
        role="img"
        aria-label="Rides per period, split by completed, cancelled and rejected"
      >
        <ResponsiveContainer width="100%" height={chartHeight}>
          <ComposedChart data={chartData} margin={chartMargin}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="label" {...axisProps} minTickGap={20} />
            <YAxis {...axisProps} width={38} allowDecimals={false} />
            <Tooltip
              content={
                <ChartTooltip
                  formatter={(value) => `${formatCount(value)} rides`}
                />
              }
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, color: chartColors.slate500 }}
            />
            <Bar
              dataKey="completed"
              name="Completed"
              stackId="rides"
              fill={chartColors.emerald}
              radius={[3, 3, 0, 0]}
              maxBarSize={56}
            />
            <Bar
              dataKey="cancelled"
              name="Cancelled"
              stackId="rides"
              fill={chartColors.rose}
              radius={[3, 3, 0, 0]}
              maxBarSize={56}
            />
            <Bar
              dataKey="rejected"
              name="Rejected"
              stackId="rides"
              fill={chartColors.amber}
              radius={[3, 3, 0, 0]}
              maxBarSize={56}
            />
            <Line
              dataKey="total"
              name="Total"
              type="monotone"
              stroke={chartColors.slate900}
              strokeWidth={2}
              dot={singlePoint ? { r: 3 } : false}
            />
            {hasPrevious && (
              <Line
                dataKey="previousTotal"
                name="Previous total"
                type="monotone"
                stroke={chartColors.slate400}
                strokeDasharray="5 4"
                strokeWidth={1.5}
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </AnalyticsCard>
  );
}
