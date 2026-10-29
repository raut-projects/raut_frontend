import {
  Area,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
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
  const { points, latest, isSeries } = series
  const composition = latest
    ? [
        { name: 'Platform fees', value: latest.platformFees, color: chartColors.violet },
        { name: 'Driver earnings', value: latest.driverEarnings, color: chartColors.sky },
      ].filter((entry) => entry.value > 0)
    : []

  const empty = isSeries ? points.length === 0 : composition.length === 0

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
      subtitle={isSeries ? 'Revenue by period' : 'Revenue split for the selected period'}
      badge={isSeries ? 'Series' : 'Current period'}
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={empty}
      emptyMessage="No revenue recorded for this period."
      height={chartHeight}
      footer={footer}
    >
      {isSeries ? (
        <div role="img" aria-label="Revenue per period, split between platform fees and driver earnings">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <ComposedChart data={points} margin={chartMargin}>
              <defs>
                <linearGradient id="platformFeesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColors.violet} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={chartColors.violet} stopOpacity={0.04} />
                </linearGradient>
                <linearGradient id="driverEarningsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColors.sky} stopOpacity={0.32} />
                  <stop offset="100%" stopColor={chartColors.sky} stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...axisProps} minTickGap={20} />
              <YAxis {...axisProps} width={58} tickFormatter={formatCompactMoney} />
              <Tooltip content={<ChartTooltip formatter={(value) => formatMoney(value)} />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, color: chartColors.slate500 }}
              />
              <Area
                dataKey="platformFees"
                name="Platform fees"
                type="monotone"
                stackId="revenue"
                stroke={chartColors.violet}
                fill="url(#platformFeesFill)"
                strokeWidth={2}
              />
              <Area
                dataKey="driverEarnings"
                name="Driver earnings"
                type="monotone"
                stackId="revenue"
                stroke={chartColors.sky}
                fill="url(#driverEarningsFill)"
                strokeWidth={2}
              />
              <Line
                dataKey="totalRevenue"
                name="Total revenue"
                type="monotone"
                stroke={chartColors.slate900}
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div role="img" aria-label="Revenue composition between platform fees and driver earnings">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart>
              <Pie
                data={composition}
                dataKey="value"
                nameKey="name"
                innerRadius={62}
                outerRadius={92}
                paddingAngle={2}
                stroke="none"
              >
                {composition.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip formatter={(value) => formatMoney(value)} />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, color: chartColors.slate500 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </AnalyticsCard>
  )
}
