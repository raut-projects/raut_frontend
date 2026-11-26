"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertsSection } from "@/components/dashboard/AlertsSection";
import { HourlyRevenueChart } from "@/components/dashboard/HourlyRevenueChart";
import { LiveMapPreview } from "@/components/dashboard/LiveMapPreview";
import { OperationsStatCards } from "@/components/dashboard/OperationsStatCards";
import { RoleFocusPanel } from "@/components/dashboard/RoleFocusPanel";
import { SystemHealthWidget } from "@/components/dashboard/SystemHealthWidget";
import { useDashboard } from "@/hooks/useDashboard";
import { useDashboardRealtime } from "@/hooks/useDashboardOps";
import {
  formatRangeLabel,
  getCustomRange,
  getDefaultRange,
  todayInput,
} from "@/lib/dateRange";
import { downloadAnalyticsCsv } from "@/lib/analyticsExport";
import type {
  AnalyticsRange,
  AnalyticsSeries,
  DriverStats,
  RevenuePoint,
  RidesPoint,
} from "@/types/index";
import { Clock3 } from "lucide-react";

import { useSession } from "@/hooks/useSession";

const dateTimeFormatter = new Intl.DateTimeFormat("en-TZ", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Africa/Dar_es_Salaam",
});

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

function Dashboard() {
  const searchParams = useSearchParams();
  const [range, setRange] = useState<AnalyticsRange>(() => {
    if (searchParams.get("range") === "today") {
      return getCustomRange(todayInput(), todayInput()) ?? getDefaultRange();
    }
    return getDefaultRange();
  });
  const [compare, setCompare] = useState(false);
  useDashboardRealtime();
  const {
    data,
    isError,
    error,
    dataUpdatedAt,
  } = useDashboard(range, compare);

  const overview = data?.overview ?? {};
  const ridesAnalytics = data?.ridesAnalytics ?? EMPTY_RIDES;
  const revenueAnalytics = data?.revenueAnalytics ?? EMPTY_REVENUE;
  const previousRidesAnalytics = data?.previousRidesAnalytics ?? null;
  const previousRevenueAnalytics = data?.previousRevenueAnalytics ?? null;
  const comparison = data?.comparison ?? null;
  const driversAnalytics = data?.driversAnalytics ?? EMPTY_DRIVERS;
  const peakHours = data?.peakHours ?? [];

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

  const session = useSession();
  const [now, setNow] = useState(() => new Date());
  const firstName = session?.name?.trim().split(/\s+/)[0] || "there";

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

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

      <div className="space-y-6 print:hidden">
        {/* <DashboardWelcome /> */ }
        <section className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome back, { firstName }
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Last login: { session?.signedInAt || "—" }
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
            <Clock3 className="size-4 text-slate-400" aria-hidden="true" />
            <time dateTime={ now.toISOString() }>{ dateTimeFormatter.format(now) } EAT</time>
          </div>
        </section>
        <OperationsStatCards />
        <LiveMapPreview />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <HourlyRevenueChart />
          <SystemHealthWidget />
        </div>
        <AlertsSection />
        <RoleFocusPanel />
      </div>
    </div>
  );
}

function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-slate-500">Loading dashboard…</div>
      }
    >
      <Dashboard />
    </Suspense>
  );
}

export default DashboardPage;
