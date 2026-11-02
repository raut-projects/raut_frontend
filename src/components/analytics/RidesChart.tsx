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
} from 'recharts'
import { AnalyticsCard } from './AnalyticsCard'
import { ChartTooltip } from './ChartTooltip'
import { axisProps, chartColors, chartHeight, chartMargin, gridProps } from '../../lib/chartTheme'
import { formatCount, formatDistance, formatMoney } from '../../services/mappers'
import type { AnalyticsSeries, RidesPoint } from '../../types/index'

interface RidesChartProps {
  series: AnalyticsSeries<RidesPoint>
  loading?: boolean
  error?: any
  onRetry?: () => void
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}

export function RidesChart({ series, loading, error, onRetry }: RidesChartProps) {
  const { points, latest } = series
  const singlePoint = points.length <= 1

  const empty = points.length === 0

  const footer = latest ? (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatChip label="Total rides" value={formatCount(latest.total)} />
      <StatChip label="Total fare" value={formatMoney(latest.fare)} />
      <StatChip label="Avg fare" value={formatMoney(latest.avgFare)} />
      <StatChip label="Avg distance" value={formatDistance(latest.avgDistance)} />
    </div>
  ) : null

  return (
    <AnalyticsCard
      title="Rides analytics"
      subtitle="Rides by period"
      badge={singlePoint ? 'Current period' : 'Series'}
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={empty}
      emptyMessage="No rides recorded for this period."
      height={chartHeight}
      footer={footer}
    >
      <div role="img" aria-label="Rides per period, split by completed, cancelled and rejected">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <ComposedChart data={points} margin={chartMargin}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="label" {...axisProps} minTickGap={20} />
            <YAxis {...axisProps} width={38} allowDecimals={false} />
            <Tooltip content={<ChartTooltip formatter={(value) => `${formatCount(value)} rides`} />} />
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
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </AnalyticsCard>
  )
}
