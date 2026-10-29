import type { ReactNode } from 'react'
import { QueryError } from '../queryStates'

interface AnalyticsCardProps {
  title: string
  subtitle?: string
  badge?: string
  loading?: boolean
  error?: any
  onRetry?: () => void
  empty?: boolean
  emptyMessage?: string
  height?: number
  footer?: ReactNode
  children: ReactNode
}

export function ChartSkeleton({ height = 260 }: { height?: number }) {
  return (
    <div className="flex items-end gap-2" style={{ height }} aria-hidden="true">
      {Array.from({ length: 12 }, (_, index) => (
        <span
          key={index}
          className="flex-1 animate-pulse rounded-t bg-slate-100"
          style={{ height: `${25 + ((index * 37) % 70)}%` }}
        />
      ))}
    </div>
  )
}

export function AnalyticsCard({
  title,
  subtitle,
  badge,
  loading,
  error,
  onRetry,
  empty,
  emptyMessage = 'No data available for this period.',
  height = 260,
  footer,
  children,
}: AnalyticsCardProps) {
  return (
    <div className="card overflow-hidden">
      <div className="card-header">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {badge && <span className="badge bg-slate-50 text-slate-600 ring-slate-500/20">{badge}</span>}
      </div>

      <div className="p-4 sm:p-6">
        {loading ? (
          <ChartSkeleton height={height} />
        ) : error ? (
          <QueryError error={error} onRetry={onRetry} />
        ) : empty ? (
          <div
            className="flex flex-col items-center justify-center gap-2 text-center"
            style={{ height }}
          >
            <svg
              className="h-6 w-6 text-slate-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
              />
            </svg>
            <p className="text-sm text-slate-500">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </div>

      {footer && !loading && !error && !empty && (
        <div className="border-t border-slate-100 px-6 py-3.5">{footer}</div>
      )}
    </div>
  )
}
