export const chartColors = {
  slate900: '#0f172a',
  slate500: '#64748b',
  slate400: '#94a3b8',
  grid: '#e2e8f0',
  emerald: '#10b981',
  rose: '#f43f5e',
  amber: '#f59e0b',
  violet: '#8b5cf6',
  sky: '#0ea5e9',
  indigo: '#6366f1',
}

export const axisProps = {
  tick: { fontSize: 11, fill: chartColors.slate500 },
  tickLine: false,
  axisLine: false,
}

export const gridProps = {
  stroke: chartColors.grid,
  strokeDasharray: '3 3',
  vertical: false,
}

export const chartMargin = { top: 8, right: 8, left: 0, bottom: 0 }

export const chartHeight = 260
