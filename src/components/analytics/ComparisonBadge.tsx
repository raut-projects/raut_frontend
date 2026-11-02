import type { MetricDelta } from '../../types/index'

interface ComparisonBadgeProps {
  delta?: MetricDelta | null
}

export function ComparisonBadge({ delta }: ComparisonBadgeProps) {
  if (!delta) return null

  const isNew = delta.deltaPct === null
  const positive = delta.delta > 0
  const flat = delta.delta === 0
  const text = isNew
    ? delta.current > 0
      ? 'New'
      : '—'
    : `${flat ? '' : positive ? '↑ ' : '↓ '}${Math.abs(delta.deltaPct).toFixed(1)}%`
  const tone = isNew
    ? 'bg-slate-100 text-slate-600 ring-slate-200'
    : flat
      ? 'bg-slate-100 text-slate-600 ring-slate-200'
      : positive
        ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
        : 'bg-rose-50 text-rose-700 ring-rose-600/20'

  return (
    <span
      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${tone}`}
      title={`Previous period: ${delta.previous.toLocaleString()} (${text})`}
    >
      {text}
    </span>
  )
}
