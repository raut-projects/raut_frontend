// Analytics date-range math. Parses and formats YYYY-MM-DD inputs, builds preset
// and custom ranges with a hard 365-day cap, derives the comparison window and
// computes metric deltas. Dates are handled in UTC at day granularity.

import type {
  AnalyticsComparisonWindow,
  AnalyticsGranularity,
  AnalyticsPreset,
  AnalyticsRange,
  MetricDelta,
} from "../types/index";

// Milliseconds in one day, used for range arithmetic.
const DAY_MS = 86_400_000;
/** Hard cap on how many days a custom range or comparison window may span. */
export const MAX_RANGE_DAYS = 365;

/** Preset range choices shown in the analytics range picker. */
export const RANGE_PRESETS: Array<{ value: AnalyticsPreset; label: string }> = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
  { value: "custom", label: "Custom" },
];

/**
 * Parses a `YYYY-MM-DD` string into a UTC midnight Date.
 *
 * Returns null for empty input or an unparseable date.
 */
export const parseDateInput = (value: string): Date | null => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** Returns a copy of `value` truncated to 00:00:00.000 UTC. */
export const startOfDay = (value: Date): Date => {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

/** Returns a new date `days` days after `date`, normalised to UTC midnight. */
export const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return startOfDay(next);
};

/** Whole days from `from` to `to` (rounded), ignoring time of day. */
export const diffDays = (from: Date, to: Date): number =>
  Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);

/** Formats a Date as a `YYYY-MM-DD` string using its UTC parts. */
export const toDateInput = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/** Today's date as a `YYYY-MM-DD` string. */
export const todayInput = (): string => toDateInput(new Date());

/**
 * Human-readable label for a range, e.g. "Nov 1, 2026 – Nov 30, 2026".
 *
 * Falls back to "Selected period" when either endpoint cannot be parsed.
 */
export const formatRangeLabel = (range: AnalyticsRange): string => {
  const start = parseDateInput(range.startStr);
  const end = parseDateInput(range.endStr);
  if (!start || !end) return "Selected period";
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
};

// Chooses chart granularity: day up to 31 days, week up to 120, month beyond.
const granularityForDays = (days: number): AnalyticsGranularity => {
  if (days > 120) return "month";
  if (days > 31) return "week";
  return "day";
};

/**
 * Builds the range for a preset.
 *
 * The window is inclusive of today and spans 7, 30 or 90 days; the 90-day
 * preset uses weekly granularity.
 */
export const getPresetRange = (
  preset: Exclude<AnalyticsPreset, "custom">,
): AnalyticsRange => {
  const end = startOfDay(new Date());
  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  const start = addDays(end, -(days - 1));

  return {
    preset,
    granularity: preset === "90d" ? "week" : "day",
    start,
    end,
    daysBack: days,
    startStr: toDateInput(start),
    endStr: toDateInput(end),
  };
};

/**
 * Builds a custom range from two `YYYY-MM-DD` strings.
 *
 * Returns null when the inputs are unparseable, start is after end, end is in
 * the future, or the span is under 1 day or over {@link MAX_RANGE_DAYS}. A start
 * earlier than the 365-day window is clamped to the earliest allowed day.
 */
export const getCustomRange = (
  startStr: string,
  endStr: string,
): AnalyticsRange | null => {
  const parsedStart = parseDateInput(startStr);
  const parsedEnd = parseDateInput(endStr);
  const today = startOfDay(new Date());

  if (!parsedStart || !parsedEnd) return null;
  if (parsedStart > parsedEnd) return null;
  if (parsedEnd > today) return null;

  const earliest = addDays(today, -(MAX_RANGE_DAYS - 1));
  const start = parsedStart < earliest ? earliest : parsedStart;
  const days = diffDays(start, parsedEnd) + 1;

  if (days < 1 || days > MAX_RANGE_DAYS) return null;

  const daysBack = Math.min(MAX_RANGE_DAYS, diffDays(start, today) + 1);

  return {
    preset: "custom",
    granularity: granularityForDays(days),
    start,
    end: parsedEnd,
    daysBack,
    startStr: toDateInput(start),
    endStr: toDateInput(parsedEnd),
  };
};

/** Default analytics range: the last 30 days. */
export const getDefaultRange = (): AnalyticsRange => getPresetRange("30d");

/**
 * Computes the immediately preceding period of equal length for comparison.
 *
 * `enabled` is false (with a `reason`) when the previous period would fall
 * outside the {@link MAX_RANGE_DAYS} analytics limit.
 */
export const getComparisonWindow = (
  range: AnalyticsRange,
): AnalyticsComparisonWindow => {
  const rangeDays = diffDays(range.start, range.end) + 1;
  const previousEnd = addDays(range.start, -1);
  const previousStart = addDays(previousEnd, -(rangeDays - 1));
  const today = startOfDay(new Date());
  const fetchDays = diffDays(previousStart, today) + 1;

  return {
    enabled: fetchDays <= MAX_RANGE_DAYS,
    previousStart,
    previousEnd,
    previousStartStr: toDateInput(previousStart),
    previousEndStr: toDateInput(previousEnd),
    fetchDays,
    reason:
      fetchDays > MAX_RANGE_DAYS
        ? "Comparison is unavailable because the previous period is outside the 365-day analytics limit."
        : null,
  };
};

/**
 * Computes the absolute and percentage change from `previous` to `current`.
 *
 * `deltaPct` is null when `previous` is 0, since a percentage change is
 * undefined; callers typically render this as "New".
 */
export const computeDelta = (
  current: number,
  previous: number,
): MetricDelta => {
  const delta = current - previous;
  const deltaPct = previous === 0 ? null : (delta / previous) * 100;

  return { current, previous, delta, deltaPct };
};
