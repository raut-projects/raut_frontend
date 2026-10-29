import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AnalyticsCard } from './AnalyticsCard'
import { ChartTooltip } from './ChartTooltip'
import { axisProps, chartColors, gridProps } from '../../lib/chartTheme'
import { formatCompactMoney, formatCount, formatMoney } from '../../services/mappers'
import type { AnalyticsOverview } from '../../types/index'

interface OverviewMetricsProps {
  overview: AnalyticsOverview
  loading?: boolean
  error?: any
  onRetry?: () => void
}

const METRICS: Array<{ key: keyof AnalyticsOverview; label: string; money?: boolean }> = [
  { key: 'total_users', label: 'Total users' },
  { key: 'total_drivers', label: 'Total drivers' },
  { key: 'verified_drivers', label: 'Verified drivers' },
  { key: 'pending_drivers', label: 'Pending drivers' },
  { key: 'rejected_drivers', label: 'Rejected drivers' },
  { key: 'suspended_drivers', label: 'Suspended drivers' },
  { key: 'active_rides_now', label: 'Active rides now' },
  { key: 'active_routes_now', label: 'Active routes now' },
  { key: 'rides_today', label: 'Rides today' },
  { key: 'rides_this_week', label: 'Rides this week' },
  { key: 'rides_this_month', label: 'Rides this month' },
  { key: 'completed_rides_today', label: 'Completed today' },
  { key: 'completed_rides_this_week', label: 'Completed this week' },
  { key: 'completed_rides_this_month', label: 'Completed this month' },
  { key: 'revenue_today_tzs', label: 'Revenue today', money: true },
  { key: 'revenue_this_week_tzs', label: 'Revenue this week', money: true },
  { key: 'revenue_this_month_tzs', label: 'Revenue this month', money: true },
  { key: 'pending_payouts_count', label: 'Pending payouts' },
  { key: 'pending_payouts_amount_tzs', label: 'Pending payout amount', money: true },
  { key: 'pending_documents_count', label: 'Pending documents' },
]

const num = (value: unknown) => {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : 0
}

export function OverviewMetrics({ overview, loading, error, onRetry }: OverviewMetricsProps) {
  const chartData = [
    {
      label: 'Today',
      rides: num(overview.rides_today),
      revenue: num(overview.revenue_today_tzs),
    },
    {
      label: 'This week',
      rides: num(overview.rides_this_week),
      revenue: num(overview.revenue_this_week_tzs),
    },
    {
      label: 'This month',
      rides: num(overview.rides_this_month),
      revenue: num(overview.revenue_this_month_tzs),
    },
  ]

  const metrics = METRICS.filter(
    (metric) => overview[metric.key] !== undefined && overview[metric.key] !== null,
  )

  return (
    <AnalyticsCard
      title="Platform overview"
      subtitle="Every metric returned by the overview endpoint"
      badge="All time + today"
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
          aria-label="Rides and revenue compared across today, this week and this month"
        >
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis yAxisId="rides" {...axisProps} width={38} allowDecimals={false} />
              <YAxis
                yAxisId="revenue"
                orientation="right"
                {...axisProps}
                width={58}
                tickFormatter={formatCompactMoney}
              />
              <Tooltip
                content={
                  <ChartTooltip
                    formatter={(value, _name, dataKey) =>
                      dataKey === 'revenue' ? formatMoney(value) : `${formatCount(value)} rides`
                    }
                  />
                }
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, color: chartColors.slate500 }}
              />
              <Bar
                yAxisId="rides"
                dataKey="rides"
                name="Rides"
                fill={chartColors.slate900}
                radius={[3, 3, 0, 0]}
                barSize={28}
              />
              <Bar
                yAxisId="revenue"
                dataKey="revenue"
                name="Revenue"
                fill={chartColors.violet}
                radius={[3, 3, 0, 0]}
                barSize={28}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.key} className="rounded-xl border border-slate-100 bg-slate-50/40 p-3.5">
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
  )
}
