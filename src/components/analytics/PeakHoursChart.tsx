import {
  Bar,
  CartesianGrid,
  Cell,
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
import { formatCompactMoney, formatCount, formatMoney } from '../../services/mappers'
import type { PeakHourPoint } from '../../types/index'

interface PeakHoursChartProps {
  points: PeakHourPoint[]
  periodDays: number
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

export function PeakHoursChart({ points, periodDays, loading, error, onRetry }: PeakHoursChartProps) {
  const peak = points.reduce<PeakHourPoint | null>(
    (best, entry) => (best === null || entry.rides > best.rides ? entry : best),
    null,
  )
  const totalRides = points.reduce((sum, entry) => sum + entry.rides, 0)
  const totalRevenue = points.reduce((sum, entry) => sum + entry.revenue, 0)
  const avgFare = totalRides
    ? Math.round(points.reduce((sum, entry) => sum + entry.avgFare * entry.rides, 0) / totalRides)
    : 0

  const footer = (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatChip label="Peak hour" value={peak ? peak.label : '—'} />
      <StatChip label="Total rides" value={formatCount(totalRides)} />
      <StatChip label="Revenue" value={formatMoney(totalRevenue)} />
      <StatChip label="Avg fare" value={formatMoney(avgFare)} />
    </div>
  )

  return (
    <AnalyticsCard
      title="Peak hours"
      subtitle={`Ride demand by hour over the last ${periodDays} day${periodDays === 1 ? '' : 's'}`}
      badge={`${periodDays}d window`}
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={points.length === 0}
      emptyMessage="No hourly demand recorded for this window."
      height={chartHeight}
      footer={footer}
    >
      <div role="img" aria-label="Ride demand by hour of day with average fare overlay">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <ComposedChart data={points} margin={chartMargin}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="label" {...axisProps} interval={1} tick={{ fontSize: 10, fill: chartColors.slate500 }} />
            <YAxis yAxisId="rides" {...axisProps} width={38} allowDecimals={false} />
            <YAxis
              yAxisId="fare"
              orientation="right"
              {...axisProps}
              width={58}
              tickFormatter={formatCompactMoney}
            />
            <Tooltip
              content={
                <ChartTooltip
                  formatter={(value, _name, dataKey) =>
                    dataKey === 'avgFare' ? formatMoney(value) : `${formatCount(value)} rides`
                  }
                />
              }
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, color: chartColors.slate500 }}
            />
            <Bar yAxisId="rides" dataKey="rides" name="Rides" radius={[3, 3, 0, 0]}>
              {points.map((entry) => (
                <Cell
                  key={entry.hour}
                  fill={peak && entry.hour === peak.hour ? chartColors.amber : chartColors.slate900}
                />
              ))}
            </Bar>
            <Line
              yAxisId="fare"
              dataKey="avgFare"
              name="Avg fare"
              type="monotone"
              stroke={chartColors.violet}
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </AnalyticsCard>
  )
}
