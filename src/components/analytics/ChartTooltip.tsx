interface ChartTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string | number
  formatter?: (value: any, name?: string, dataKey?: string) => string
}

export function ChartTooltip({ active, payload, label, formatter }: ChartTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-elevated">
      {label !== undefined && (
        <p className="mb-1.5 text-xs font-semibold text-slate-500">{label}</p>
      )}
      <ul className="space-y-1">
        {payload.map((entry, index) => (
          <li key={`${entry.dataKey ?? entry.name ?? index}`} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color ?? entry.payload?.fill ?? '#94a3b8' }}
            />
            <span className="text-slate-500">{entry.name}</span>
            <span className="ml-auto pl-3 font-semibold text-slate-900">
              {formatter ? formatter(entry.value, entry.name, entry.dataKey) : entry.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
