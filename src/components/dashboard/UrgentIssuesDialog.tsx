"use client";

import Link from "next/link";
import { ArrowUpRight, Inbox } from "lucide-react";

import { QueryError } from "@/components/queryStates";
import SidePanel from "@/components/SidePanel";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardAlerts } from "@/hooks/useDashboardOps";
import type { DashboardAlert } from "@/types/dashboardOps";

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const asText = (value: unknown, fallback = "") => {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number") return String(value);
  return fallback;
};

const isUrgent = (alert: DashboardAlert) => {
  const value = asText(asRecord(alert).priority).toLowerCase();
  return value === "urgent" || value === "critical" || value === "high";
};

const alertType = (alert: DashboardAlert) =>
  asText(
    asRecord(alert).type ?? asRecord(alert).category ?? asRecord(alert).kind,
    "Operational issue",
  );

const alertHref = (alert: DashboardAlert) => {
  const record = asRecord(alert);
  return asText(
    record.href ?? record.actionHref ?? record.actionUrl ?? record.link,
    "/live-rides",
  );
};

type UrgentIssuesDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function UrgentIssuesDialog({ open, onClose }: UrgentIssuesDialogProps) {
  const { data, isPending, isError, error, refetch } = useDashboardAlerts();

  const payload = asRecord(data);
  const source = Array.isArray(data)
    ? (data as DashboardAlert[])
    : Array.isArray(payload.alerts)
      ? (payload.alerts as DashboardAlert[])
      : [];
  const urgent = source.filter(isUrgent);
  const groups = urgent.reduce((result, alert) => {
    const key = alertType(alert);
    const group = result.get(key) ?? [];
    group.push(alert);
    result.set(key, group);
    return result;
  }, new Map<string, DashboardAlert[]>());

  return (
    <SidePanel
      open={ open }
      onClose={ onClose }
      title="Urgent issues"
      description={ `${urgent.length} alert${urgent.length === 1 ? "" : "s"} need attention` }
      footer={
        <Link
          href="/live-rides"
          onClick={ onClose }
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900"
        >
          Open live rides
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </Link>
      }
    >
      { isPending && (
        <div className="space-y-3" aria-label="Loading urgent issues">
          { Array.from({ length: 4 }, (_, index) => (
            <div key={ index } className="space-y-2 border-b border-slate-100 pb-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          )) }
        </div>
      ) }

      { isError && <QueryError error={ error } onRetry={ refetch } /> }

      { !isPending && !isError && urgent.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-14 text-center">
          <Inbox className="size-7 text-slate-300" aria-hidden="true" />
          <p className="text-sm font-medium text-slate-700">No urgent issues</p>
          <p className="text-xs text-slate-500">
            Critical alerts will appear here when a ride or service needs review.
          </p>
        </div>
      ) }

      { !isPending && !isError && urgent.length > 0 && (
        <div className="space-y-5">
          { [...groups.entries()].map(([type, alerts]) => (
            <section key={ type } className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">{ type }</h3>
                <Badge variant="outline" className="rounded-md border-slate-200 bg-slate-50 text-slate-600">
                  { alerts.length }
                </Badge>
              </div>
              <ul className="divide-y divide-slate-100 border-y border-slate-200">
                { alerts.map((alert, index) => {
                  const record = asRecord(alert);
                  const title = asText(
                    record.title ?? record.message ?? record.summary,
                    "Operational alert",
                  );
                  const detail = asText(record.description ?? record.detail);
                  const count = Number(record.count);
                  const actionLabel = asText(
                    record.actionLabel ?? record.action,
                    "Review",
                  );

                  return (
                    <li key={ asText(record.id, `${type}-${index}`) } className="py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900">
                            { title }
                            { Number.isFinite(count) && count > 1 && (
                              <span className="ml-1.5 text-xs font-normal text-slate-500">
                                ×{ count }
                              </span>
                            ) }
                          </p>
                          { detail && (
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              { detail }
                            </p>
                          ) }
                        </div>
                        <Link
                          href={ alertHref(alert) }
                          onClick={ onClose }
                          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900"
                        >
                          { actionLabel }
                          <ArrowUpRight className="size-3.5" aria-hidden="true" />
                        </Link>
                      </div>
                    </li>
                  );
                }) }
              </ul>
            </section>
          )) }
        </div>
      ) }
    </SidePanel>
  );
}
