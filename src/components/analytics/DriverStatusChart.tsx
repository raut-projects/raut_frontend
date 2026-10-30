import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { AnalyticsCard } from './AnalyticsCard'
import { ChartTooltip } from './ChartTooltip'
import { chartColors, chartHeight } from '../../lib/chartTheme'
import { formatCount } from '../../services/mappers'
import type { DriverStats } from '../../types/index'

interface DriverStatusChartProps {
  stats: DriverStats
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

export function DriverStatusChart({ stats, loading, error, onRetry }: DriverStatusChartProps) {
  const accounted = stats.verified + stats.pending + stats.rejected + stats.suspended
  const other = Math.max(0, stats.totalDrivers - accounted)

  const data = [
    { name: 'Verified', value: stats.verified, color: chartColors.emerald },
    { name: 'Pending', value: stats.pending, color: chartColors.amber },
    { name: 'Rejected', value: stats.rejected, color: chartColors.rose },
    { name: 'Suspended', value: stats.suspended, color: chartColors.slate400 },
    { name: 'Other', value: other, color: chartColors.indigo },
  ].filter((entry) => entry.value > 0)

  const footer = (
    <div className="grid grid-cols-2 gap-4">
      <StatChip label="Active today" value={formatCount(stats.activeToday)} />
      <StatChip label="Complete docs" value={formatCount(stats.completeDocs)} />
      <StatChip label="Registered this week" value={formatCount(stats.registeredThisWeek)} />
      <StatChip label="Pending documents" value={formatCount(stats.pendingDocuments)} />
    </div>
  )

  return (
    <AnalyticsCard
      title="Driver status"
      subtitle={`${formatCount(stats.totalDrivers)} registered drivers`}
      badge="Current period"
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={data.length === 0}
      emptyMessage="No driver records available."
      height={chartHeight}
      footer={footer}
    >
      <div role="img" aria-label="Driver status distribution">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip formatter={(value) => `${formatCount(value)} drivers`} />} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, color: chartColors.slate500 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </AnalyticsCard>
  )
}
