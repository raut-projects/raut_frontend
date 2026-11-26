"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartTooltip } from "@/components/analytics/ChartTooltip";
import { QueryError } from "@/components/queryStates";
import { Skeleton } from "@/components/ui/skeleton";
import { useHourlyRevenue } from "@/hooks/useDashboardOps";
import {
  axisProps,
  chartColors,
  chartHeight,
  chartMargin,
  gridProps,
} from "@/lib/chartTheme";
import { formatCompactMoney, formatMoney } from "@/services/mappers";

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const pick = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
};

const numberValue = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const normalizePoints = (payload: unknown) => {
  const source = Array.isArray(payload)
    ? payload
    : Array.isArray(asRecord(payload).points)
      ? (asRecord(payload).points as unknown[])
      : Array.isArray(asRecord(payload).items)
        ? (asRecord(payload).items as unknown[])
        : Array.isArray(asRecord(payload).data)
          ? (asRecord(payload).data as unknown[])
          : [];

  return source.map((point, index) => {
    const record = asRecord(point);
    const rawHour = pick(record, ["hour", "hourLabel", "label", "time", "date"]);
    const hour =
      typeof rawHour === "string" && rawHour.includes("T")
        ? new Date(rawHour).toLocaleTimeString("en-TZ", {
            hour: "2-digit",
            hour12: false,
            timeZone: "Africa/Dar_es_Salaam",
          })
        : String(rawHour ?? index);

    return {
      hour,
      revenue: numberValue(
        pick(record, ["revenue", "amount", "total", "tzs", "value"]),
      ),
    };
  });
};

export function HourlyRevenueChart() {
  const { data, isPending, isError, error, refetch } = useHourlyRevenue();
  const points = normalizePoints(data);
  const total = points.reduce((sum, point) => sum + point.revenue, 0);

  return (
    <section aria-label="Hourly revenue">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Hourly revenue</h2>
          <p className="mt-0.5 text-xs text-slate-500">Today, by hour</p>
        </div>
        {!isPending && !isError && (
          <span className="text-sm font-semibold tabular-nums text-slate-900">
            {formatMoney(total)}
          </span>
        )}
      </div>

      {isPending && (
        <div className="pt-4">
          <Skeleton style={{ height: chartHeight }} className="w-full" />
        </div>
      )}

      {isError && (
        <div className="pt-4">
          <QueryError error={error} onRetry={refetch} />
        </div>
      )}

      {!isPending && !isError && points.length === 0 && (
        <div className="flex h-64 items-center justify-center text-sm text-slate-500">
          No revenue recorded today.
        </div>
      )}

      {!isPending && !isError && points.length > 0 && (
        <div
          className="pt-4"
          role="img"
          aria-label="Hourly revenue for today"
        >
          <ResponsiveContainer width="100%" height={chartHeight}>
            <AreaChart data={points} margin={chartMargin}>
              <defs>
                <linearGradient id="hourlyRevenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColors.slate900} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={chartColors.slate900} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="hour" {...axisProps} minTickGap={20} />
              <YAxis
                {...axisProps}
                width={62}
                tickFormatter={formatCompactMoney}
              />
              <Tooltip
                content={<ChartTooltip formatter={(value) => formatMoney(value)} />}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="none"
                fill="url(#hourlyRevenueFill)"
              />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke={chartColors.slate900}
                strokeWidth={2.5}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
