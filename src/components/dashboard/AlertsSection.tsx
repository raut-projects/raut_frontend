"use client";

import Link from "next/link";
import { ArrowUpRight, BellRing, Inbox, X } from "lucide-react";

import { QueryError } from "@/components/queryStates";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardAlertDismissals } from "@/hooks/useDashboardAlertDismissals";
import { useDashboardAlerts } from "@/hooks/useDashboardOps";
import { formatAgo } from "@/lib/liveRides";
import type { DashboardAlert, DashboardAlertPriority } from "@/types/dashboardOps";

const PRIORITY_STYLES: Record<
  DashboardAlertPriority,
  { label: string; className: string }
> = {
  critical: {
    label: "Critical",
    className: "border-rose-200 bg-rose-50 text-rose-700",
  },
  high: {
    label: "High",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  medium: {
    label: "Medium",
    className: "border-sky-200 bg-sky-50 text-sky-700",
  },
  low: {
    label: "Low",
    className: "border-slate-200 bg-slate-50 text-slate-600",
  },
};

export function AlertsSection() {
  const { data, isPending, isError, error, refetch } = useDashboardAlerts();
  const alerts = (data ?? []) as DashboardAlert[];
  const { visibleAlerts, dismissAlert } = useDashboardAlertDismissals(alerts);

  return (
    <section aria-label="Alerts">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <BellRing className="size-4 text-slate-500" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-slate-900">Alerts</h2>
          { !isPending && !isError && visibleAlerts.length > 0 && (
            <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">
              { visibleAlerts.length }
            </span>
          ) }
        </div>
        <Link
          href="/support-tickets"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          View tickets
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>

      { isPending && (
        <div className="space-y-2 pt-4">
          { Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={ index } className="h-12 w-full" />
          )) }
        </div>
      ) }

      { isError && (
        <div className="pt-4">
          <QueryError error={ error } onRetry={ refetch } />
        </div>
      ) }

      { !isPending && !isError && visibleAlerts.length === 0 && (
        <div className="flex h-32 flex-col items-center justify-center gap-2 text-center">
          <Inbox className="size-6 text-slate-300" aria-hidden="true" />
          <p className="text-sm font-medium text-slate-700">You&apos;re all caught up</p>
          <p className="text-xs text-slate-500">New alerts will appear here.</p>
        </div>
      ) }

      { !isPending && !isError && visibleAlerts.length > 0 && (
        <ul className="divide-y divide-slate-100">
          { visibleAlerts.map((alert) => {
            const priority = PRIORITY_STYLES[alert.priority] ?? PRIORITY_STYLES.low;
            return (
              <li key={ alert.id } className="flex items-start gap-3 py-3">
                <span
                  className={ `mt-0.5 shrink-0 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${priority.className}` }
                >
                  { priority.label }
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    { alert.title }
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-500">
                    { alert.description }
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    { formatAgo(alert.createdAt) }
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Link
                    href={ alert.href }
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    { alert.actionLabel }
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    aria-label={ `Dismiss ${alert.title}` }
                    onClick={ () => dismissAlert(alert.id) }
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          }) }
        </ul>
      ) }
    </section>
  );
}
