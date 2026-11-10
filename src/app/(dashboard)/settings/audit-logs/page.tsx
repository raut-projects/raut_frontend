"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Download,
  Search,
  ShieldCheck,
  UsersRound,
  X,
} from "lucide-react";

import SidePanel from "@/components/SidePanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AUDIT_CATEGORIES,
  AUDIT_SEVERITY_LABELS,
  AUDIT_SEVERITIES,
  auditDateKey,
  downloadAuditLogsCsv,
  formatAuditDateTime,
  MOCK_AUDIT_LOGS,
  type AuditCategory,
  type AuditLogEntry,
  type AuditSeverity,
} from "@/lib/auditLogs";

const PAGE_SIZE = 10;

const severityStyles: Record<AuditSeverity, string> = {
  info: "bg-slate-100 text-slate-600",
  warning: "bg-amber-50 text-amber-800",
  critical: "bg-rose-50 text-rose-700",
};

const categoryStyles: Record<AuditCategory, string> = {
  User: "bg-slate-100 text-slate-700",
  Driver: "bg-violet-50 text-violet-700",
  Ride: "bg-sky-50 text-sky-700",
  Payout: "bg-emerald-50 text-emerald-700",
  Promotion: "bg-orange-50 text-orange-800",
  Settings: "bg-indigo-50 text-indigo-700",
};

const controlClass =
  "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-100";

function Stat({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof Activity;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 border-b border-slate-200 pb-3 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4 last:border-0">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">
          {value}
        </p>
        <p className="truncate text-xs text-slate-500">{note}</p>
      </div>
    </div>
  );
}

function ChangeBlock({
  label,
  value,
  tone,
}: {
  label: string;
  value?: Record<string, unknown>;
  tone: "before" | "after";
}) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="mb-2 text-xs font-semibold text-slate-600">{label}</p>
      {value ? (
        <pre
          className={`overflow-x-auto whitespace-pre-wrap wrap-break-words rounded-md p-3 font-mono text-xs leading-5 ${
            tone === "before"
              ? "bg-white text-slate-600"
              : "bg-white text-slate-800"
          }`}
        >
          {JSON.stringify(value, null, 2)}
        </pre>
      ) : (
        <p className="text-sm text-slate-500">No previous value recorded.</p>
      )}
    </div>
  );
}

function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<AuditCategory | "all">("all");
  const [severity, setSeverity] = useState<AuditSeverity | "all">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  const filteredEntries = useMemo(() => {
    const term = search.trim().toLowerCase();

    return [...MOCK_AUDIT_LOGS]
      .filter((entry) => {
        if (category !== "all" && entry.category !== category) return false;
        if (severity !== "all" && entry.severity !== severity) return false;

        const entryDate = auditDateKey(entry.occurredAt);
        if (fromDate && entryDate < fromDate) return false;
        if (toDate && entryDate > toDate) return false;

        if (!term) return true;

        return [
          entry.id,
          entry.actor,
          entry.actorEmail,
          entry.actorRole,
          entry.category,
          entry.action,
          entry.target,
          entry.targetId,
          entry.summary,
          entry.ipAddress,
        ].some((field) => field.toLowerCase().includes(term));
      })
      .sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
      );
  }, [category, fromDate, search, severity, toDate]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleEntries = filteredEntries.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );
  const rangeStart = filteredEntries.length === 0 ? 0 : startIndex + 1;
  const rangeEnd = Math.min(startIndex + PAGE_SIZE, filteredEntries.length);
  const hasFilters = Boolean(
    search.trim() ||
      category !== "all" ||
      severity !== "all" ||
      fromDate ||
      toDate,
  );
  const invalidDateRange = Boolean(fromDate && toDate && fromDate > toDate);

  const resetPage = () => setPage(1);

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setSeverity("all");
    setFromDate("");
    setToDate("");
    resetPage();
  };

  const uniqueAdmins = new Set(MOCK_AUDIT_LOGS.map((entry) => entry.actor)).size;
  const elevatedEvents = MOCK_AUDIT_LOGS.filter(
    (entry) => entry.severity !== "info",
  ).length;
  const criticalEvents = MOCK_AUDIT_LOGS.filter(
    (entry) => entry.severity === "critical",
  ).length;

  const exportCsv = () => {
    if (!filteredEntries.length) return;
    downloadAuditLogsCsv(filteredEntries);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Audit Logs
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Review administrative activity across Raut. Sample records are for
            demonstration and do not represent live platform events.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={exportCsv}
          disabled={filteredEntries.length === 0}
          className="h-9 w-full border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
        >
          <Download className="size-4" aria-hidden="true" />
          Export filtered CSV
        </Button>
      </header>

      <section
        aria-label="Audit activity summary"
        className="grid gap-4 border-y border-slate-200 py-4 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-4 xl:grid-cols-4"
      >
        <Stat
          label="Recorded events"
          value={MOCK_AUDIT_LOGS.length.toLocaleString("en-TZ")}
          note="In this sample dataset"
          icon={Activity}
        />
        <Stat
          label="Needs attention"
          value={elevatedEvents.toLocaleString("en-TZ")}
          note="Warnings and critical events"
          icon={CircleAlert}
        />
        <Stat
          label="Critical events"
          value={criticalEvents.toLocaleString("en-TZ")}
          note="Elevated access or safety actions"
          icon={ShieldCheck}
        />
        <Stat
          label="Administrators"
          value={uniqueAdmins.toLocaleString("en-TZ")}
          note="Distinct actors in the sample"
          icon={UsersRound}
        />
      </section>

      <section
        aria-label="Filter audit events"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(15rem,1.5fr)_repeat(4,minmax(8rem,1fr))_auto]"
      >
        <div className="relative sm:col-span-2 xl:col-span-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              resetPage();
            }}
            placeholder="Search actor, event, target or ID"
            aria-label="Search audit events"
            className="h-9 bg-white pl-9"
          />
        </div>

        <label className="space-y-1">
          <span className="sr-only">Filter by category</span>
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value as AuditCategory | "all");
              resetPage();
            }}
            className={controlClass}
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {AUDIT_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="sr-only">Filter by severity</span>
          <select
            value={severity}
            onChange={(event) => {
              setSeverity(event.target.value as AuditSeverity | "all");
              resetPage();
            }}
            className={controlClass}
            aria-label="Filter by severity"
          >
            <option value="all">All severity</option>
            {AUDIT_SEVERITIES.map((item) => (
              <option key={item} value={item}>
                {AUDIT_SEVERITY_LABELS[item]}
              </option>
            ))}
          </select>
        </label>

        <label className="relative">
          <span className="sr-only">From date</span>
          <CalendarDays
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(event) => {
              setFromDate(event.target.value);
              resetPage();
            }}
            aria-label="From date"
            className={`${controlClass} pl-9`}
          />
        </label>

        <label className="relative">
          <span className="sr-only">To date</span>
          <CalendarDays
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(event) => {
              setToDate(event.target.value);
              resetPage();
            }}
            aria-label="To date"
            className={`${controlClass} pl-9`}
          />
        </label>

        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 justify-start px-2 text-slate-500 hover:text-slate-800 sm:col-span-2 xl:col-span-1"
          >
            <X className="size-4" aria-hidden="true" />
            Clear filters
          </Button>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-slate-200 px-4 py-3 sm:px-5">
          <p className="text-xs text-slate-500" aria-live="polite">
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {rangeStart}-{rangeEnd}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">
              {filteredEntries.length}
            </span>{" "}
            event{filteredEntries.length === 1 ? "" : "s"}
          </p>
          <p className="text-xs text-slate-400">Newest activity first</p>
        </div>

        {invalidDateRange ? (
          <div className="px-4 py-14 text-center">
            <p className="text-sm font-semibold text-slate-800">
              Check the selected dates
            </p>
            <p className="mt-1 text-sm text-slate-500">
              The start date must be on or before the end date.
            </p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <Search className="size-4" aria-hidden="true" />
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-800">
              No audit events found
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              Try a different search or adjust the filters to see more activity.
            </p>
            {hasFilters && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="mt-4 border-slate-200 bg-white"
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader className="bg-slate-50 [&_tr]:border-slate-200">
                <TableRow className="hover:bg-transparent">
                  <TableHead>When</TableHead>
                  <TableHead>Administrator</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead className="hidden md:table-cell">Target</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead className="hidden xl:table-cell">
                    IP address
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleEntries.map((entry) => (
                  <TableRow
                    key={entry.id}
                    tabIndex={0}
                    onClick={() => setSelectedEntry(entry)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedEntry(entry);
                      }
                    }}
                    aria-label={`View ${entry.action} by ${entry.actor}`}
                    className="cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2px focus-visible:outline-slate-500"
                  >
                    <TableCell className="whitespace-normal">
                      <span className="block font-medium tabular-nums text-slate-800">
                        {formatAuditDateTime(entry.occurredAt)}
                      </span>
                      <span className="mt-0.5 block font-mono text-[0.65rem] text-slate-400">
                        {entry.id}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <span className="block font-medium text-slate-800">
                        {entry.actor}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {entry.actorRole}
                      </span>
                    </TableCell>
                    <TableCell className="min-w-52 whitespace-normal">
                      <span className="block font-medium text-slate-800">
                        {entry.action}
                      </span>
                      <span
                        className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${categoryStyles[entry.category]}`}
                      >
                        {entry.category}
                      </span>
                    </TableCell>
                    <TableCell className="hidden whitespace-normal md:table-cell">
                      <span className="block text-slate-700">{entry.target}</span>
                      <span className="mt-0.5 block font-mono text-[0.65rem] text-slate-400">
                        {entry.targetId}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${severityStyles[entry.severity]}`}
                      >
                        {AUDIT_SEVERITY_LABELS[entry.severity]}
                      </span>
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs text-slate-500 xl:table-cell">
                      {entry.ipAddress}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-xs text-slate-500">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="h-8 border-slate-200 bg-white px-2.5"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage >= totalPages}
                  className="h-8 border-slate-200 bg-white px-2.5"
                >
                  Next
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </>
        )}
      </section>

      <SidePanel
        open={Boolean(selectedEntry)}
        onClose={() => setSelectedEntry(null)}
        title="Audit event details"
        description={selectedEntry?.id}
        footer={
          <Button
            type="button"
            variant="outline"
            onClick={() => setSelectedEntry(null)}
            className="border-slate-200 bg-white"
          >
            Close details
          </Button>
        }
        wide
      >
        {selectedEntry && (
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${categoryStyles[selectedEntry.category]}`}
                >
                  {selectedEntry.category}
                </span>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${severityStyles[selectedEntry.severity]}`}
                >
                  {AUDIT_SEVERITY_LABELS[selectedEntry.severity]} risk
                </span>
              </div>
              <h3 className="mt-3 text-lg font-semibold tracking-tight text-slate-900">
                {selectedEntry.action}
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {selectedEntry.summary}
              </p>
            </div>

            <dl className="grid gap-x-5 gap-y-4 border-y border-slate-200 py-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold text-slate-500">Actor</dt>
                <dd className="mt-1 text-sm font-medium text-slate-800">
                  {selectedEntry.actor}
                </dd>
                <dd className="mt-0.5 break-all text-xs text-slate-500">
                  {selectedEntry.actorEmail}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">Role</dt>
                <dd className="mt-1 text-sm text-slate-800">
                  {selectedEntry.actorRole}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">
                  Date and time · East Africa Time
                </dt>
                <dd className="mt-1 text-sm tabular-nums text-slate-800">
                  {formatAuditDateTime(selectedEntry.occurredAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">Target</dt>
                <dd className="mt-1 text-sm text-slate-800">
                  {selectedEntry.target}
                </dd>
                <dd className="mt-0.5 font-mono text-xs text-slate-500">
                  {selectedEntry.targetId}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">
                  IP address
                </dt>
                <dd className="mt-1 font-mono text-sm text-slate-800">
                  {selectedEntry.ipAddress}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">
                  Browser and device
                </dt>
                <dd className="mt-1 text-sm text-slate-800">
                  {selectedEntry.userAgent}
                </dd>
              </div>
            </dl>

            <section aria-labelledby="audit-change-heading" className="space-y-3">
              <div>
                <h4
                  id="audit-change-heading"
                  className="text-sm font-semibold text-slate-900"
                >
                  Recorded changes
                </h4>
                <p className="mt-0.5 text-xs text-slate-500">
                  Before and after values captured for this action.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <ChangeBlock
                  label="Before"
                  value={selectedEntry.before}
                  tone="before"
                />
                <ChangeBlock
                  label="After"
                  value={selectedEntry.after}
                  tone="after"
                />
              </div>
            </section>
          </div>
        )}
      </SidePanel>
    </div>
  );
}

export default AuditLogsPage;
