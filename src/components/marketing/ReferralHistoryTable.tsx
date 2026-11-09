"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Search } from "lucide-react";

import { useToast } from "@/components/toastContext";
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
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useReferrals } from "@/hooks/useMarketing";
import {
  downloadReferralsCsv,
  formatReferralDate,
  formatTzs,
  REFERRAL_STATUS_LABELS,
  type Referral,
} from "@/lib/marketing";
import { listReferrals } from "@/services/marketing";
import { usePageViewField } from "@/store/pageViewStore";

const PAGE_SIZE = 25;

const STATUS_OPTIONS = ["all", "pending", "completed", "expired"];

const controlClass =
  "h-9 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";

const statusTone: Record<string, string> = {
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  expired: "border-slate-200 bg-slate-100 text-slate-600",
};

function statusLabel(status: string) {
  return (
    REFERRAL_STATUS_LABELS[status] ??
    status.charAt(0).toUpperCase() + status.slice(1)
  );
}

export function ReferralHistoryTable() {
  const toast = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [status, setStatus] = usePageViewField("marketingReferrals", "status");
  const [search, setSearch] = usePageViewField("marketingReferrals", "search");
  const [from, setFrom] = usePageViewField("marketingReferrals", "from");
  const [to, setTo] = usePageViewField("marketingReferrals", "to");
  const [page, setPage] = usePageViewField("marketingReferrals", "page");

  const debouncedSearch = useDebouncedValue(search, 300);
  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch,
      status,
      from,
      to,
    }),
    [page, debouncedSearch, status, from, to],
  );

  const query = useReferrals(params);
  const referrals = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const rangeStart = total === 0 ? 0 : startIndex + 1;
  const rangeEnd = Math.min(startIndex + PAGE_SIZE, total);
  const rangeLabel =
    rangeEnd > rangeStart ? `${rangeStart}-${rangeEnd}` : String(rangeStart);
  const hasFilters =
    search.trim() !== "" || status !== "all" || from !== "" || to !== "";

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, setPage, totalPages]);

  const resetPage = () => setPage(1);

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setFrom("");
    setTo("");
    resetPage();
  };

  const exportReferrals = async () => {
    if (total === 0) {
      toast.error("There are no referrals to export.");
      return;
    }

    setIsExporting(true);
    try {
      const exported: Referral[] = [];
      const seen = new Set<string>();
      let exportPage = 1;
      let exportTotal = total;

      while (exported.length < exportTotal) {
        const result = await listReferrals({
          search: debouncedSearch,
          status,
          from,
          to,
          page: exportPage,
          limit: 100,
        });
        const newItems = result.items.filter(
          (referral) => !seen.has(referral.id),
        );

        if (!newItems.length) break;

        newItems.forEach((referral) => seen.add(referral.id));
        exported.push(...newItems);
        exportTotal = result.total;
        exportPage += 1;
      }

      if (!exported.length) {
        toast.error("No referrals were returned for export.");
        return;
      }

      downloadReferralsCsv(exported);
      toast.success(
        `Exported ${exported.length} referral${exported.length === 1 ? "" : "s"}.`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not export referrals.",
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-md">
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
            placeholder="Search by referrer, referee or ID."
            aria-label="Search referrals"
            className="h-9 bg-white pl-9"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:ml-auto">
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              resetPage();
            }}
            aria-label="Filter referrals by status"
            className={`${controlClass} pl-3 pr-8`}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "All statuses" : statusLabel(option)}
              </option>
            ))}
          </select>

          <Input
            type="date"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value);
              resetPage();
            }}
            aria-label="Referrals from date"
            className="h-9 bg-white"
          />

          <Input
            type="date"
            value={to}
            onChange={(event) => {
              setTo(event.target.value);
              resetPage();
            }}
            aria-label="Referrals to date"
            className="h-9 bg-white"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 sm:px-5">
          <p className="text-xs text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">{rangeLabel}</span> of{" "}
            <span className="font-semibold text-slate-700">{total}</span> referral
            {total === 1 ? "" : "s"}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void exportReferrals()}
            disabled={total === 0 || isExporting}
            className="h-auto border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="size-3.5" aria-hidden="true" />
            {isExporting ? "Exporting…" : "Export"}
          </Button>
        </div>

        <Table>
          <TableHeader className="bg-slate-50 [&_tr]:border-slate-200">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-28">Referral</TableHead>
              <TableHead>Referrer</TableHead>
              <TableHead>Referee</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Rewards</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {query.isError && (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="px-4 py-12 text-center whitespace-normal"
                >
                  <p className="text-sm font-medium text-rose-700">
                    {query.error instanceof Error
                      ? query.error.message
                      : "Referrals could not be loaded."}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void query.refetch()}
                    className="mt-3"
                  >
                    Try again
                  </Button>
                </TableCell>
              </TableRow>
            )}

            {query.isPending && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="px-4 py-12 text-center">
                  <span className="text-sm text-slate-500">
                    Loading referrals…
                  </span>
                </TableCell>
              </TableRow>
            )}

            {referrals.map((referral) => (
              <TableRow key={referral.id}>
                <TableCell>
                  <span className="font-mono text-xs font-semibold text-slate-700">
                    {referral.id}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="block font-medium text-slate-900">
                    {referral.referrerName}
                  </span>
                  <span className="text-xs text-slate-500">
                    {referral.referrerType === "driver"
                      ? "Driver"
                      : referral.referrerType === "rider"
                        ? "Rider"
                        : "User"}
                  </span>
                </TableCell>
                <TableCell className="font-medium text-slate-800">
                  {referral.refereeName}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="block text-slate-600">
                    {formatReferralDate(referral.createdAt)}
                  </span>
                  <span className="text-xs text-slate-400 md:hidden">
                    {statusLabel(referral.status)}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                      statusTone[referral.status] ??
                      "border-slate-200 bg-slate-100 text-slate-600"
                    }`}
                  >
                    {statusLabel(referral.status)}
                  </span>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <span className="block text-xs text-slate-600">
                    {formatTzs(referral.referrerRewardTzs)} referrer
                  </span>
                  <span className="block text-xs text-slate-400">
                    {formatTzs(referral.refereeRewardTzs)} referee
                  </span>
                </TableCell>
              </TableRow>
            ))}

            {!query.isError &&
              !query.isPending &&
              referrals.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={6}
                    className="px-4 py-12 text-center whitespace-normal"
                  >
                    <p className="text-sm font-medium text-slate-700">
                      No referrals match these filters.
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Try a different search or reset the filters.
                    </p>
                    {hasFilters && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                        className="mt-3 h-auto border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Clear filters
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )}
          </TableBody>
        </Table>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3.5 sm:px-5">
          <p className="text-xs text-slate-500">
            Page{" "}
            <span className="font-semibold text-slate-700">{currentPage}</span> of{" "}
            <span className="font-semibold text-slate-700">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="h-auto border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:text-slate-400 disabled:opacity-100"
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="h-auto border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:text-slate-400 disabled:opacity-100"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
