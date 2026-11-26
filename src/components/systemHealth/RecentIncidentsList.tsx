"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import {
  IncidentSeverityBadge,
  IncidentStatusBadge,
} from "./healthBadges";
import type { HealthIncident, IncidentStatus } from "@/lib/systemHealth";

type RecentIncidentsListProps = {
  incidents: HealthIncident[];
  compact?: boolean;
};

type Severity = HealthIncident["severity"];
type StatusFilter = IncidentStatus | "all";
type SeverityFilter = Severity | "all";

const statusOptions: StatusFilter[] = [
  "all",
  "Investigating",
  "Monitoring",
  "Resolved",
];

const severityOptions: SeverityFilter[] = ["all", "Major", "Minor"];

const selectClass =
  "h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";

export function RecentIncidentsList({
  incidents,
  compact = false,
}: RecentIncidentsListProps) {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const visibleIncidents = compact
    ? incidents.slice(0, 3)
    : incidents.filter(
        (incident) =>
          (status === "all" || incident.status === status) &&
          (severity === "all" || incident.severity === severity),
      );

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Recent incidents
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {compact
              ? "Illustrative service events and their current state."
              : "Service events from the sample snapshot and their current state."}
          </p>
        </div>
        {compact ? (
          <Link
            href="/settings/system-health/incidents"
            className="inline-flex items-center gap-1.5 rounded-md text-xs font-semibold text-brand-700 transition-colors hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            View all
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        ) : (
          <CheckCircle2
            className="size-4 shrink-0 text-slate-400"
            aria-hidden="true"
          />
        )}
      </div>

      {!compact && (
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-slate-600">Status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as StatusFilter)}
              aria-label="Filter incidents by status"
              className={selectClass}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All statuses" : option}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-slate-600">
              Severity
            </span>
            <select
              value={severity}
              onChange={(event) =>
                setSeverity(event.target.value as SeverityFilter)
              }
              aria-label="Filter incidents by severity"
              className={selectClass}
            >
              {severityOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All severities" : option}
                </option>
              ))}
            </select>
          </label>
          <p className="ml-auto text-xs text-slate-500">
            {visibleIncidents.length} of {incidents.length} incidents
          </p>
        </div>
      )}

      {visibleIncidents.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-slate-500 sm:px-5">
          No incidents match these filters.
        </p>
      ) : (
        <ol className="divide-y divide-slate-100">
          {visibleIncidents.map((incident) => (
            <li key={incident.id} className="px-4 py-4 sm:px-5">
              <div className="flex items-start gap-3">
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${
                    incident.status === "Resolved"
                      ? "bg-slate-300"
                      : incident.severity === "Major"
                        ? "bg-rose-500"
                        : "bg-amber-500"
                  }`}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-semibold text-slate-900">
                      {incident.title}
                    </h4>
                    <IncidentStatusBadge status={incident.status} />
                    <IncidentSeverityBadge severity={incident.severity} />
                  </div>
                  <p className="mt-1 text-xs font-medium text-slate-600">
                    {incident.service} · {incident.startedAt}
                  </p>
                  {!compact && (
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {incident.summary}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-slate-400">
                    Duration: {incident.duration}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default RecentIncidentsList;
