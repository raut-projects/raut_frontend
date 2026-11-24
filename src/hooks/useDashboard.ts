/**
 * Dashboard analytics query for the operations overview.
 * Loads range-scoped totals and trends, optionally with a comparison period.
 * Collaborates with the dashboard service and queryKeys.dashboard.
 */
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getDashboard } from "../services/dashboard";
import { queryKeys } from "../lib/queryKeys";
import type { AnalyticsRange } from "../types/index";

/**
 * Fetches dashboard analytics for a date range.
 *
 * Query key: `dashboard.byRange(range, compare)`, which includes the range
 * bounds, granularity, days back and compare flag, so each dashboard variant
 * caches independently. Polls every 60 seconds and retains the previous
 * range's data while a new range loads.
 *
 * @param range - Start/end bounds and granularity for the analytics window.
 * @param compare - Whether to include the previous-period comparison series.
 * @returns A React Query result containing the dashboard payload.
 */
export function useDashboard(range: AnalyticsRange, compare = false) {
  return useQuery({
    queryKey: queryKeys.dashboard.byRange(range, compare),
    queryFn: () => getDashboard(range, compare),
    refetchInterval: 60_000,
    placeholderData: keepPreviousData,
  });
}
