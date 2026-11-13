// Shared Recharts styling tokens. Centralizes colours, axis and grid props,
// margins and the default chart height so analytics charts render consistently
// across the dashboard.

/** Brand-aligned palette used by chart series, axes and grid lines. */
export const chartColors = {
  slate900: "#0f172a",
  slate500: "#64748b",
  slate400: "#94a3b8",
  grid: "#e2e8f0",
  emerald: "#10b981",
  rose: "#f43f5e",
  amber: "#f59e0b",
  violet: "#8b5cf6",
  sky: "#0ea5e9",
  indigo: "#6366f1",
};

/**
 * Recharts XAxis/YAxis presentation: 11px slate ticks with no tick or axis
 * lines.
 */
export const axisProps = {
  tick: { fontSize: 11, fill: chartColors.slate500 },
  tickLine: false,
  axisLine: false,
};

/** Recharts CartesianGrid presentation: dashed slate lines, horizontal only. */
export const gridProps = {
  stroke: chartColors.grid,
  strokeDasharray: "3 3",
  vertical: false,
};

/** Default inner chart margin, in pixels, with no left or bottom padding. */
export const chartMargin = { top: 8, right: 8, left: 0, bottom: 0 };

/** Default chart height in pixels. */
export const chartHeight = 260;
