"use client";

import { useState } from "react";
import {
  QueryError,
  RefreshIndicator,
  TableSkeleton,
} from "@/components/queryStates";
import { AnalyticsToolbar } from "@/components/analytics/AnalyticsToolbar";
import { DriverStatusChart } from "@/components/analytics/DriverStatusChart";
import { OverviewMetrics } from "@/components/analytics/OverviewMetrics";
import { PeakHoursChart } from "@/components/analytics/PeakHoursChart";
import { RevenueChart } from "@/components/analytics/RevenueChart";
import { RidesChart } from "@/components/analytics/RidesChart";
import { useDashboard } from "@/hooks/useDashboard";
import { useSession } from "@/hooks/useSession";
import { formatRangeLabel, getDefaultRange } from "@/lib/dateRange";
import { downloadAnalyticsCsv } from "@/lib/analyticsExport";
import type {
  AnalyticsRange,
  AnalyticsSeries,
  DriverStats,
  RevenuePoint,
  RidesPoint,
} from "@/types/index";

const EMPTY_DRIVERS: DriverStats = {
  totalDrivers: 0,
  verified: 0,
  pending: 0,
  rejected: 0,
  suspended: 0,
  registeredThisWeek: 0,
  verifiedThisWeek: 0,
  pendingDocuments: 0,
  completeDocs: 0,
  activeToday: 0,
  activeRoutes: 0,
};

const EMPTY_RIDES: AnalyticsSeries<RidesPoint> = {
  isSeries: false,
  points: [],
  latest: null,
};
const EMPTY_REVENUE: AnalyticsSeries<RevenuePoint> = {
  isSeries: false,
  points: [],
  latest: null,
};

const statIcons = {
  users: (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
      />
    </svg>
  ),
  truck: (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
      />
    </svg>
  ),
  route: (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
      />
    </svg>
  ),
  currency: (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
};

function Analytics() {
  const [range, setRange] = useState<AnalyticsRange>(() => getDefaultRange());
  const [compare, setCompare] = useState(false);
  const {
    data,
    isPending,
    isError,
    error,
    isFetching,
    dataUpdatedAt,
    refetch,
  } = useDashboard(range, compare);
  const session = useSession();
  const firstName = session?.name?.split(" ")[0] ?? "there";

  const stats = data?.stats ?? [];
  const overview = data?.overview ?? {};
  const ridesAnalytics = data?.ridesAnalytics ?? EMPTY_RIDES;
  const revenueAnalytics = data?.revenueAnalytics ?? EMPTY_REVENUE;
  const previousRidesAnalytics = data?.previousRidesAnalytics ?? null;
  const previousRevenueAnalytics = data?.previousRevenueAnalytics ?? null;
  const comparison = data?.comparison ?? null;
  const comparisonUnavailableReason = data?.comparisonUnavailableReason ?? null;
  const driversAnalytics = data?.driversAnalytics ?? EMPTY_DRIVERS;
  const peakHours = data?.peakHours ?? [];
  const periodDays = data?.periodDays ?? range.daysBack;

  const handleExportCsv = () => {
    if (data) {
      downloadAnalyticsCsv({
        overview,
        ridesAnalytics,
        revenueAnalytics,
        previousRidesAnalytics,
        previousRevenueAnalytics,
        comparison,
        driversAnalytics,
        peakHours,
        range: data.range ?? range,
      });
    }
  };

  const handleExportPdf = () => {
    window.print();
  };

  const chartError = isError ? error : null;

  const getStatIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes("customer")) return statIcons.users;
    if (l.includes("driver")) return statIcons.truck;
    if (l.includes("ride") || l.includes("delivery")) return statIcons.route;
    if (l.includes("revenue") || l.includes("amount"))
      return statIcons.currency;
    return statIcons.users;
  };

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="hidden border-b border-slate-300 pb-4 print:block">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Raut
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Analytics Report
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          { formatRangeLabel(range) } · { range.granularity } grouping ·{ " " }
          { compare ? "Compared with the previous period" : "Live snapshot" }
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          Generated{ " " }
          { dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleString() : "—" }
        </p>
      </div>

      <div className="flex flex-col gap-3 print:hidden xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Analytics
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            { "Here's what's happening with your platform today." }
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end">
          <AnalyticsToolbar
            range={ range }
            compare={ compare }
            comparisonReason={ comparisonUnavailableReason }
            disabled={ !data || isFetching }
            onRangeChange={ setRange }
            onCompareChange={ setCompare }
            onExportCsv={ handleExportCsv }
            onExportPdf={ handleExportPdf }
          />
          <RefreshIndicator
            isFetching={ isFetching }
            updatedAt={ dataUpdatedAt }
            onRefresh={ refetch }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        { isPending &&
          Array.from({ length: 4 }, (_, index) => (
            <div key={ index } className="stat-card">
              <div className="flex items-center justify-between">
                <span className="block h-3.5 w-24 animate-pulse rounded bg-slate-200" />
                <span className="block h-9 w-9 animate-pulse rounded-xl bg-slate-200" />
              </div>
              <span className="mt-3 block h-7 w-16 animate-pulse rounded bg-slate-200" />
              <span className="mt-2 block h-3 w-28 animate-pulse rounded bg-slate-200" />
            </div>
          )) }

        { !isPending &&
          !isError &&
          stats.map((stat) => (
            <div key={ stat.label } className="stat-card group">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  { stat.label }
                </p>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to from-slate-50 to-slate-100/50 text-slate-700 transition-transform group-hover:scale-110">
                  { getStatIcon(stat.label) }
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                { stat.value }
              </p>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs">
                <span
                  className={ `font-semibold ${stat.up ? "text-emerald-600" : "text-rose-600"}` }
                >
                  { stat.delta }
                </span>
                <span className="text-slate-400">{ stat.hint }</span>
              </p>
            </div>
          )) }

        { isError && (
          <div className="sm:col-span-2 xl:col-span-4">
            <div className="card">
              <QueryError error={ error } onRetry={ refetch } />
            </div>
          </div>
        ) }
      </div>

      <RidesChart
        series={ ridesAnalytics }
        previous={ previousRidesAnalytics }
        comparison={ comparison }
        loading={ isPending }
        error={ chartError }
        onRetry={ refetch }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RevenueChart
            series={ revenueAnalytics }
            previous={ previousRevenueAnalytics }
            comparison={ comparison }
            loading={ isPending }
            error={ chartError }
            onRetry={ refetch }
          />
        </div>
        <div>
          <DriverStatusChart
            stats={ driversAnalytics }
            loading={ isPending }
            error={ chartError }
            onRetry={ refetch }
          />
        </div>
      </div>

      <PeakHoursChart
        points={ peakHours }
        periodDays={ periodDays }
        loading={ isPending }
        error={ chartError }
        onRetry={ refetch }
      />

      <OverviewMetrics
        overview={ overview }
        loading={ isPending }
        error={ chartError }
        onRetry={ refetch }
      />
    </div>
  );
}

export default Analytics;
