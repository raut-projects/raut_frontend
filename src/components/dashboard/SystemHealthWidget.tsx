"use client";

import Link from "next/link";
import { Activity, ArrowUpRight, CheckCircle2, TriangleAlert } from "lucide-react";

import { QueryError } from "@/components/queryStates";
import { Skeleton } from "@/components/ui/skeleton";
import { useHealthServices } from "@/hooks/useDashboardOps";
import type { DashboardHealthService } from "@/types/dashboardOps";

const STATUS_STYLES = {
  healthy: {
    label: "Healthy",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    border: "border-emerald-200",
    surface: "bg-emerald-50",
  },
  degraded: {
    label: "Degraded",
    dot: "bg-amber-500",
    text: "text-amber-700",
    border: "border-amber-200",
    surface: "bg-amber-50",
  },
  unhealthy: {
    label: "Unhealthy",
    dot: "bg-rose-500",
    text: "text-rose-700",
    border: "border-rose-200",
    surface: "bg-rose-50",
  },
} as const;

export function SystemHealthWidget() {
  const { data, isPending, isError, error, refetch } = useHealthServices();
  const services = (data ?? []) as DashboardHealthService[];
  const degraded = services.filter((service) => service.status !== "healthy").length;

  return (
    <section aria-label="System health">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-slate-500" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-slate-900">System health</h2>
        </div>
        { !isPending && !isError && (
          <span className="text-xs font-medium text-slate-500">
            { degraded === 0 ? "All systems operational" : `${degraded} need review` }
          </span>
        ) }
      </div>

      { isPending && (
        <div className="grid grid-cols-1 gap-2 pt-4 sm:grid-cols-2">
          { Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={ index } className="h-14 w-full" />
          )) }
        </div>
      ) }

      { isError && (
        <div className="pt-4">
          <QueryError error={ error } onRetry={ refetch } />
        </div>
      ) }

      { !isPending && !isError && services.length === 0 && (
        <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
          <TriangleAlert className="size-6 text-slate-300" aria-hidden="true" />
          <p className="text-sm text-slate-500">No health checks available.</p>
        </div>
      ) }

      { !isPending && !isError && services.length > 0 && (
        <div className="grid grid-cols-1 gap-2 pt-4 sm:grid-cols-2">
          { services.map((service) => {
            const style = STATUS_STYLES[service.status] ?? STATUS_STYLES.unhealthy;
            return (
              <Link
                key={ service.id }
                href="/settings/system-health"
                className="group flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 transition-colors hover:border-slate-300 hover:bg-slate-50/70"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className={ `size-2 shrink-0 rounded-full ${style.dot}` } aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-800">
                      { service.name }
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      { service.metricLabel }: { service.metricValue }
                    </span>
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <span
                    className={ `rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${style.border} ${style.surface} ${style.text}` }
                  >
                    { style.label }
                  </span>
                  <ArrowUpRight
                    className="size-3.5 text-slate-300 transition-colors group-hover:text-slate-600"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            );
          }) }
        </div>
      ) }

      { !isPending && !isError && services.length > 0 && degraded === 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          <CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden="true" />
          Last checked just now
        </p>
      ) }
    </section>
  );
}
