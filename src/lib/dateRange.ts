import type {
  AnalyticsComparisonWindow,
  AnalyticsGranularity,
  AnalyticsPreset,
  AnalyticsRange,
  MetricDelta,
} from "../types/index";

const DAY_MS = 86_400_000;
export const MAX_RANGE_DAYS = 365;

export const RANGE_PRESETS: Array<{ value: AnalyticsPreset; label: string }> = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
  { value: "custom", label: "Custom" },
];

export const parseDateInput = (value: string): Date | null => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const startOfDay = (value: Date): Date => {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

export const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return startOfDay(next);
};

export const diffDays = (from: Date, to: Date): number =>
  Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);

export const toDateInput = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const todayInput = (): string => toDateInput(new Date());

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

const granularityForDays = (days: number): AnalyticsGranularity => {
  if (days > 120) return "month";
  if (days > 31) return "week";
  return "day";
};

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

export const getDefaultRange = (): AnalyticsRange => getPresetRange("30d");

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

export const computeDelta = (
  current: number,
  previous: number,
): MetricDelta => {
  const delta = current - previous;
  const deltaPct = previous === 0 ? null : (delta / previous) * 100;

  return { current, previous, delta, deltaPct };
};
