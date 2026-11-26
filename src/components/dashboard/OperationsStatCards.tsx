"use client";

import { useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Banknote,
  CarFront,
  RefreshCw,
  UsersRound,
} from "lucide-react";

import { QueryError } from "@/components/queryStates";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/useDashboardOps";
import type { DashboardStats } from "@/types/dashboardOps";
import { UrgentIssuesDialog } from "./UrgentIssuesDialog";

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

const formatCount = (value: unknown) =>
  new Intl.NumberFormat("en-US").format(Math.round(numberValue(value)));

const formatTzs = (value: unknown) =>
  `TZS ${new Intl.NumberFormat("en-US").format(Math.round(numberValue(value)))}`;

const deltaFor = (stats: DashboardStats | null, key: string) => {
  const record = asRecord(stats);
  const deltas = asRecord(pick(record, ["deltas", "changes", "metrics"]));
  const raw = pick(deltas, [key, `${key}Delta`, `${key}Change`]) ?? pick(record, [`${key}Delta`, `${key}Change`]);
  const delta = asRecord(raw);
  const numeric = numberValue(
    pick(delta, ["percent", "value", "delta", "change"]) ?? raw,
  );
  const direction = String(
    pick(delta, ["direction", "trend", "type"]) ?? "",
  ).toLowerCase();
  const tone =
    direction === "up"
      ? "positive"
      : direction === "down"
        ? "negative"
        : direction === "flat"
          ? "neutral"
          : numeric >= 0
            ? "positive"
            : "negative";
  const label = String(pick(delta, ["label"]) ?? "").trim();

  return {
    tone: tone as "positive" | "negative" | "neutral",
    label: label || `${Math.abs(numeric).toFixed(1)}%`,
  };
};

type StatCardProps = {
  label: string;
  value: string;
  delta: { tone: "positive" | "negative" | "neutral"; label: string };
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
};

function StatCard({ label, value, delta, icon: Icon, onClick }: StatCardProps) {
  return (
    <button
      type="button"
      onClick={ onClick }
      className="group min-w-0 rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-slate-300 hover:bg-slate-50/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium text-slate-500">{ label }</span>
        <Icon className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="truncate text-xl font-bold tracking-tight text-slate-900">
          { value }
        </span>
        <span
          className={ `inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold ${delta.tone === "positive"
              ? "text-emerald-600"
              : delta.tone === "negative"
                ? "text-rose-600"
                : "text-slate-500"
            }` }
        >
          <span aria-hidden="true">
            { delta.tone === "positive" ? "↑" : delta.tone === "negative" ? "↓" : "→" }
          </span>
          { delta.label }
        </span>
      </div>
    </button>
  );
}

export function OperationsStatCards() {
  const router = useRouter();
  const { data, isPending, isFetching, isError, error, refetch } = useDashboardStats();
  const [urgentOpen, setUrgentOpen] = useState(false);
  const displayed = data as DashboardStats | undefined;
  const record = asRecord(displayed);
  const loading = isPending && !displayed;

  if (isError && !displayed) {
    return <QueryError error={ error } onRetry={ refetch } />;
  }

  return (
    <section aria-label="Operations summary">
      { isError && displayed && (
        <div className="mb-3">
          <QueryError error={ error } onRetry={ refetch } />
        </div>
      ) }
      <div className="flex items-center justify-between gap-3 pb-3">
        <h2 className="text-sm font-semibold text-slate-900">Operations at a glance</h2>
        { isFetching && displayed && (
          <RefreshCw className="size-3.5 animate-spin text-slate-400" aria-label="Refreshing" />
        ) }
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        { loading ? (
          Array.from({ length: 4 }, (_, index) => (
            <div key={ index } className="rounded-xl border border-slate-200 bg-white p-4">
              <Skeleton className="h-3 w-24" />
              <div className="mt-4 flex items-center justify-between gap-2">
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))
        ) : (
          <>
            <StatCard
              label="Active Rides"
              value={ formatCount(
                pick(record, ["activeRides", "active_rides", "ridesActive"]),
              ) }
              delta={ deltaFor(displayed, "activeRides") }
              icon={ CarFront }
              onClick={ () => router.push("/live-rides?status=active") }
            />
            <StatCard
              label="Today's Revenue"
              value={ formatTzs(
                pick(record, [
                  "todayRevenue",
                  "revenueToday",
                  "revenue_today",
                  "today_revenue",
                ]),
              ) }
              delta={ deltaFor(displayed, "todayRevenue") }
              icon={ Banknote }
              onClick={ () => router.push("/?range=today") }
            />
            <StatCard
              label="Online Drivers"
              value={ formatCount(
                pick(record, ["onlineDrivers", "driversOnline", "online_drivers"]),
              ) }
              delta={ deltaFor(displayed, "onlineDrivers") }
              icon={ UsersRound }
              onClick={ () => router.push("/drivers?status=online") }
            />
            <StatCard
              label="Urgent Issues"
              value={ formatCount(
                pick(record, ["urgentIssues", "urgentAlerts", "urgent_issues"]),
              ) }
              delta={ { tone: "neutral", label: "Open" } }
              icon={ AlertTriangle }
              onClick={ () => setUrgentOpen(true) }
            />
          </>
        ) }
      </div>
      <UrgentIssuesDialog open={ urgentOpen } onClose={ () => setUrgentOpen(false) } />
    </section>
  );
}
