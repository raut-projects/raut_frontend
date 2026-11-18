// CSV export for the analytics dashboard. Flattens the overview, rides, revenue,
// drivers, peak-hours and optional comparison data into a single report and
// triggers a browser download.

import { formatRangeLabel } from "./dateRange";
import type {
  AnalyticsComparison,
  AnalyticsOverview,
  AnalyticsRange,
  AnalyticsSeries,
  DriverStats,
  MetricDelta,
  PeakHourPoint,
  RevenuePoint,
  RidesPoint,
} from "../types/index";

interface AnalyticsExportData {
  overview: AnalyticsOverview;
  ridesAnalytics: AnalyticsSeries<RidesPoint>;
  revenueAnalytics: AnalyticsSeries<RevenuePoint>;
  previousRidesAnalytics?: AnalyticsSeries<RidesPoint> | null;
  previousRevenueAnalytics?: AnalyticsSeries<RevenuePoint> | null;
  comparison?: AnalyticsComparison | null;
  driversAnalytics: DriverStats;
  peakHours: PeakHourPoint[];
  range: AnalyticsRange;
}

const OVERVIEW_LABELS: Record<string, string> = {
  total_users: "Total users",
  total_drivers: "Total drivers",
  verified_drivers: "Verified drivers",
  pending_drivers: "Pending drivers",
  rejected_drivers: "Rejected drivers",
  suspended_drivers: "Suspended drivers",
  active_routes_now: "Active routes now",
  active_rides_now: "Active rides now",
  rides_today: "Rides today",
  rides_this_week: "Rides this week",
  rides_this_month: "Rides this month",
  completed_rides_today: "Completed rides today",
  completed_rides_this_week: "Completed rides this week",
  completed_rides_this_month: "Completed rides this month",
  revenue_today_tzs: "Revenue today (TZS)",
  revenue_this_week_tzs: "Revenue this week (TZS)",
  revenue_this_month_tzs: "Revenue this month (TZS)",
  pending_payouts_count: "Pending payouts",
  pending_payouts_amount_tzs: "Pending payouts amount (TZS)",
  pending_documents_count: "Pending documents",
};

const csvEscape = (value: unknown): string => {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const row = (...cells: unknown[]) => cells.map(csvEscape).join(",");

const overviewLabel = (key: string) =>
  OVERVIEW_LABELS[key] ??
  key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const deltaRows = (
  label: string,
  values: Array<[string, MetricDelta]>,
): string[] => [
  row(label, "Current", "Previous", "Change", "Change %"),
  ...values.map(([name, value]) =>
    row(
      name,
      value.current,
      value.previous,
      value.delta,
      value.deltaPct === null ? "New" : `${value.deltaPct.toFixed(1)}%`,
    ),
  ),
];

/**
 * Builds the full analytics report as a CSV string.
 *
 * Includes a header, platform overview, rides and revenue tables, driver
 * metrics and peak hours, followed by a previous-period comparison when
 * `data.comparison` is present.
 */
export function buildAnalyticsCsv(data: AnalyticsExportData): string {
  const lines: string[] = [
    row("Raut Analytics Report"),
    row("Range", formatRangeLabel(data.range)),
    row("Granularity", data.range.granularity),
    row("Generated", new Date().toISOString()),
    row(
      "Comparison",
      data.comparison
        ? `${data.comparison.previousStartStr} to ${data.comparison.previousEndStr}`
        : "Off",
    ),
    "",
    row("Platform overview"),
    row("Metric", "Value"),
    ...Object.entries(data.overview).map(([key, value]) =>
      row(overviewLabel(key), value),
    ),
    "",
    row("Rides"),
    row(
      "Period",
      "Total",
      "Completed",
      "Cancelled",
      "Rejected",
      "Fare (TZS)",
      "Platform fee (TZS)",
      "Avg fare (TZS)",
      "Avg distance (m)",
    ),
    ...data.ridesAnalytics.points.map((point) =>
      row(
        point.label,
        point.total,
        point.completed,
        point.cancelled,
        point.rejected,
        point.fare,
        point.platformFee,
        point.avgFare,
        point.avgDistance,
      ),
    ),
    "",
    row("Revenue"),
    row(
      "Period",
      "Total revenue (TZS)",
      "Platform fees (TZS)",
      "Driver earnings (TZS)",
      "Payouts (TZS)",
      "Transactions",
    ),
    ...data.revenueAnalytics.points.map((point) =>
      row(
        point.label,
        point.totalRevenue,
        point.platformFees,
        point.driverEarnings,
        point.payouts,
        point.transactions,
      ),
    ),
    "",
    row("Drivers"),
    row("Metric", "Value"),
    row("Total drivers", data.driversAnalytics.totalDrivers),
    row("Verified", data.driversAnalytics.verified),
    row("Pending", data.driversAnalytics.pending),
    row("Rejected", data.driversAnalytics.rejected),
    row("Suspended", data.driversAnalytics.suspended),
    row("Registered this week", data.driversAnalytics.registeredThisWeek),
    row("Verified this week", data.driversAnalytics.verifiedThisWeek),
    row("Pending documents", data.driversAnalytics.pendingDocuments),
    row("Complete documents", data.driversAnalytics.completeDocs),
    row("Active today", data.driversAnalytics.activeToday),
    row("Active routes", data.driversAnalytics.activeRoutes),
    "",
    row("Peak hours"),
    row("Hour", "Rides", "Avg fare (TZS)", "Revenue (TZS)"),
    ...data.peakHours.map((point) =>
      row(point.label, point.rides, point.avgFare, point.revenue),
    ),
  ];

  if (data.comparison) {
    lines.push("");
    lines.push(
      row(
        "Previous period comparison",
        `${data.comparison.previousStartStr} to ${data.comparison.previousEndStr}`,
      ),
    );
    lines.push(
      ...deltaRows("Rides", [
        ["Total rides", data.comparison.rides.total],
        ["Completed rides", data.comparison.rides.completed],
        ["Cancelled rides", data.comparison.rides.cancelled],
        ["Total fare", data.comparison.rides.fare],
      ]),
    );
    lines.push("");
    lines.push(
      ...deltaRows("Revenue", [
        ["Total revenue", data.comparison.revenue.totalRevenue],
        ["Platform fees", data.comparison.revenue.platformFees],
        ["Driver earnings", data.comparison.revenue.driverEarnings],
        ["Transactions", data.comparison.revenue.transactions],
      ]),
    );
  }

  // Leading BOM and CRLF line endings so Excel opens the CSV correctly.
  return `\uFEFF${lines.join("\r\n")}`;
}

/** Triggers a browser download of the analytics CSV, named by the range dates. */
export function downloadAnalyticsCsv(data: AnalyticsExportData) {
  const content = buildAnalyticsCsv(data);
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `raut-analytics-${data.range.startStr}_${data.range.endStr}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
