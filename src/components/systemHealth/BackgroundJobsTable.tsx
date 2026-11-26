"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Workflow } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { JOB_STATUS_LABELS, type HealthJob, type JobStatus } from "@/lib/systemHealth";
import { JobStatusBadge } from "./healthBadges";

type BackgroundJobsTableProps = {
  jobs: HealthJob[];
  compact?: boolean;
};

type JobFilter = JobStatus | "all";

const jobFilters: Array<{ value: JobFilter; label: string }> = [
  { value: "all", label: "All jobs" },
  { value: "healthy", label: JOB_STATUS_LABELS.healthy },
  { value: "delayed", label: JOB_STATUS_LABELS.delayed },
  { value: "attention", label: JOB_STATUS_LABELS.attention },
];

export function BackgroundJobsTable({
  jobs,
  compact = false,
}: BackgroundJobsTableProps) {
  const [filter, setFilter] = useState<JobFilter>("all");
  const visibleJobs = compact
    ? jobs.slice(0, 3)
    : filter === "all"
      ? jobs
      : jobs.filter((job) => job.status === filter);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Background jobs
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {compact
              ? "Latest example runs from scheduled platform work."
              : "Scheduled and asynchronous work from the sample snapshot."}
          </p>
        </div>
        {compact ? (
          <Link
            href="/settings/system-health/jobs"
            className="inline-flex items-center gap-1.5 rounded-md text-xs font-semibold text-brand-700 transition-colors hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            View all
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        ) : (
          <Workflow
            className="size-4 shrink-0 text-slate-400"
            aria-hidden="true"
          />
        )}
      </div>

      {!compact && (
        <div
          role="group"
          aria-label="Filter background jobs by status"
          className="flex flex-wrap gap-1 border-b border-slate-200 px-4 py-3 sm:px-5"
        >
          {jobFilters.map((option) => {
            const selected = option.value === filter;

            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => setFilter(option.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
                  selected
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}

      <Table>
        <TableHeader className="bg-slate-50 [&_tr]:border-slate-200">
          <TableRow className="hover:bg-transparent">
            <TableHead>Job</TableHead>
            {!compact && <TableHead>Description</TableHead>}
            <TableHead>Status</TableHead>
            {!compact && <TableHead>Note</TableHead>}
            <TableHead className="hidden text-right sm:table-cell">
              Last run
            </TableHead>
            {!compact && (
              <TableHead className="hidden text-right sm:table-cell">
                Duration
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleJobs.length === 0 ? (
            <TableRow>
              <TableCell
                className="whitespace-normal py-8 text-center text-sm text-slate-500"
                colSpan={compact ? 3 : 6}
              >
                No jobs match this status.
              </TableCell>
            </TableRow>
          ) : (
            visibleJobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="whitespace-normal">
                  <span className="block font-medium text-slate-800">
                    {job.name}
                  </span>
                  {compact && (
                    <span className="mt-0.5 block max-w-sm text-xs leading-5 text-slate-500">
                      {job.description}
                    </span>
                  )}
                  <span className="mt-1 block text-xs text-slate-500 sm:hidden">
                    {job.lastRun} · {job.duration}
                  </span>
                </TableCell>
                {!compact && (
                  <TableCell className="max-w-72 whitespace-normal text-xs leading-5 text-slate-500">
                    {job.description}
                  </TableCell>
                )}
                <TableCell>
                  <JobStatusBadge status={job.status} />
                </TableCell>
                {!compact && (
                  <TableCell className="max-w-64 whitespace-normal text-xs leading-5 text-slate-600">
                    {job.note}
                  </TableCell>
                )}
                <TableCell className="hidden text-right sm:table-cell">
                  <span className="block text-xs font-medium text-slate-700">
                    {job.lastRun}
                  </span>
                  {!compact && (
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {job.duration}
                    </span>
                  )}
                </TableCell>
                {!compact && (
                  <TableCell className="hidden text-right text-xs font-medium tabular-nums text-slate-700 sm:table-cell">
                    {job.duration}
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </section>
  );
}

export default BackgroundJobsTable;
