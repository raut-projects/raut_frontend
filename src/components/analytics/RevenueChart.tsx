import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AnalyticsCard } from './AnalyticsCard'
import { ChartTooltip } from './ChartTooltip'
import { axisProps, chartColors, chartHeight, chartMargin, gridProps } from '../../lib/chartTheme'
import { formatCompactMoney, formatCount, formatMoney } from '../../services/mappers'
import type { AnalyticsSeries, RevenuePoint } from '../../types/index'

interface RevenueChartProps {
  series: AnalyticsSeries<RevenuePoint>
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

export function RevenueChart({ series, loading, error, onRetry }: RevenueChartProps) {
  const { points, latest } = series
  const singlePoint = points.length <= 1

  const empty = points.length === 0

  const footer = latest ? (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatChip label="Revenue" value={formatMoney(latest.totalRevenue)} />
      <StatChip label="Platform fees" value={formatMoney(latest.platformFees)} />
      <StatChip label="Driver earnings" value={formatMoney(latest.driverEarnings)} />
      <StatChip label="Transactions" value={formatCount(latest.transactions)} />
    </div>
  ) : null

  return (
    <AnalyticsCard
      title="Revenue analytics"
      subtitle="Revenue by period"
      badge={singlePoint ? 'Current period' : 'Series'}
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={empty}
      emptyMessage="No revenue recorded for this period."
      height={chartHeight}
      footer={footer}
    >
      <div role="img" aria-label="Revenue per period, split between platform fees and driver earnings">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart data={points} margin={chartMargin}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="label" {...axisProps} minTickGap={20} />
            <YAxis {...axisProps} width={58} tickFormatter={formatCompactMoney} />
            <Tooltip content={<ChartTooltip formatter={(value) => formatMoney(value)} />} />
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
          </LineChart>
        </ResponsiveContainer>
      </div>
    </AnalyticsCard>
  )
}
