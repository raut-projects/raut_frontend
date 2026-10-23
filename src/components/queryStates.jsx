import { useEffect, useState } from 'react'

export function TableSkeleton({ rows = 6, cols = 6 }) {
  return (
    <tbody>
      {Array.from({ length: rows }, (_, row) => (
        <tr key={row}>
          {Array.from({ length: cols }, (_, col) => (
            <td key={col} className="table-td">
              <span className="block h-3.5 w-full animate-pulse rounded bg-slate-200" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )
}

export function QueryError({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
      <svg
        className="h-6 w-6 text-rose-500"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
        />
      </svg>
      <p className="text-sm font-medium text-slate-700">
        {error?.message ?? 'Something went wrong while loading this data.'}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        Try again
      </button>
    </div>
  )
}

export function RefreshIndicator({ isFetching, updatedAt, onRefresh }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5_000)
    return () => clearInterval(timer)
  }, [])

  const seconds = updatedAt ? Math.max(0, Math.round((now - updatedAt) / 1000)) : null
  const label =
    seconds === null
      ? 'not synced yet'
      : seconds < 5
        ? 'just now'
        : seconds < 60
          ? `${seconds}s ago`
          : `${Math.round(seconds / 60)}m ago`

  return (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <span className={isFetching ? 'font-medium text-brand-600' : ''}>
        {isFetching ? 'Refreshing…' : `Updated ${label}`}
      </span>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isFetching}
        className="rounded-md p-1 text-slate-400 transition-colors hover:text-slate-600 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        aria-label="Refresh data"
      >
        <svg
          className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992V4.356M3.06 14.652h4.992v4.992M4.031 9.349a8.25 8.25 0 0113.803-3.7l3.181 3.182m-18 3.118a8.25 8.25 0 0013.803 3.7l3.182-3.182"
          />
        </svg>
      </button>
    </div>
  )
}
