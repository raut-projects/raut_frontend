"use client";

import { useState } from "react";
import Link from "next/link";
import { EllipsisVertical, FileCheck2, FileDown } from "lucide-react";
import {
  QueryError,
  RefreshIndicator,
  TableSkeleton,
} from "@/components/queryStates";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog, ReasonDialog } from "@/components/reasonDialog";
import ViewPayoutPanel from "@/components/viewPayoutPanel";
import { usePayouts } from "@/hooks/usePayouts";
import { useDrivers } from "@/hooks/useDrivers";
import { useToast } from "@/components/toastContext";
import {
  useApprovePayout,
  useRejectPayout,
  useRetryPayout,
} from "@/hooks/useAdminActions";
import { formatMoney } from "@/services/mappers";
import { usePageViewField } from "@/store/pageViewStore";

const statusStyles = {
  Pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Scheduled: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Processing: "bg-brand-50 text-brand-700 ring-brand-600/20",
  Approved: "bg-brand-50 text-brand-700 ring-brand-600/20",
  Paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Failed: "bg-rose-50 text-rose-700 ring-rose-600/20",
  Reversed: "bg-rose-50 text-rose-700 ring-rose-600/20",
  Rejected: "bg-rose-50 text-rose-700 ring-rose-600/20",
  Cancelled: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const statusDots = {
  Pending: "bg-amber-500",
  Scheduled: "bg-amber-500",
  Processing: "bg-brand-500",
  Approved: "bg-brand-500",
  Paid: "bg-emerald-500",
  Failed: "bg-rose-500",
  Reversed: "bg-rose-500",
  Rejected: "bg-rose-500",
  Cancelled: "bg-slate-400",
};

const PAGE_SIZE = 8;

const controlClass =
  "rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function printPayoutReceipt(payout) {
  const receiptWindow = window.open("", "_blank");
  if (!receiptWindow) {
    throw new Error("Allow pop-ups to print or save this receipt as a PDF.");
  }

  const fields = [
    ["Driver", payout.driverName],
    ["Amount", payout.amountLabel],
    ["Payment method", payout.method],
    ["Destination", payout.methodDetails],
    ["Reference", payout.reference],
    ["Requested", payout.requestedAt],
    ["Processed", payout.processedAt],
  ];

  receiptWindow.document.open();
  receiptWindow.document.write(`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Payout receipt ${escapeHtml(payout.reference)}</title>
        <style>
          body { color: #1e293b; font: 14px/1.5 Arial, sans-serif; margin: 0; padding: 48px; }
          main { margin: 0 auto; max-width: 680px; }
          h1 { font-size: 24px; margin: 0 0 6px; }
          p { color: #64748b; margin: 0 0 28px; }
          dl { border-top: 1px solid #e2e8f0; margin: 0; }
          dl div { border-bottom: 1px solid #e2e8f0; display: grid; gap: 20px; grid-template-columns: 180px 1fr; padding: 14px 0; }
          dt { color: #64748b; } dd { font-weight: 600; margin: 0; overflow-wrap: anywhere; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <main>
          <h1>Payout receipt</h1>
          <p>Paid payout record</p>
          <dl>${fields
            .map(
              ([label, value]) =>
                `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`,
            )
            .join("")}</dl>
        </main>
      </body>
    </html>`);
  receiptWindow.document.close();
  receiptWindow.focus();
  window.setTimeout(() => receiptWindow.print(), 250);
}

function Payouts() {
  const [status, setStatus] = usePageViewField("payouts", "status");
  const [method, setMethod] = usePageViewField("payouts", "method");
  const [driverId, setDriverId] = usePageViewField("payouts", "driverId");
  const [from, setFrom] = usePageViewField("payouts", "from");
  const [to, setTo] = usePageViewField("payouts", "to");
  const [page, setPage] = usePageViewField("payouts", "page");
  const [viewTarget, setViewTarget] = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);
  const [approveNotes, setApproveNotes] = useState("");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [retryTarget, setRetryTarget] = useState(null);
  const toast = useToast();

  const params = { status, method, driverId, from, to, page, limit: PAGE_SIZE };

  const {
    data,
    isPending,
    isError,
    error,
    isFetching,
    isPlaceholderData,
    dataUpdatedAt,
    refetch,
  } = usePayouts(params);

  // The driver filter needs the fleet, the backend filters payouts by driver id.
  const { data: driverData } = useDrivers({ page: 1, limit: 100 });
  const drivers = driverData?.items ?? [];

  const approvePayout = useApprovePayout();
  const rejectPayout = useRejectPayout();
  const retryPayout = useRetryPayout();

  const payouts = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const summary = data?.summary;

  const summaryCards = [
    {
      label: "Awaiting approval",
      value: summary?.awaitingCount ?? 0,
      hint: formatMoney(summary?.awaitingAmount ?? 0),
      status: "pending",
    },
    {
      label: "Paid",
      value: summary?.settledCount ?? 0,
      hint: formatMoney(summary?.settledAmount ?? 0),
      status: "paid",
    },
    {
      label: "Needs retry",
      value: summary?.failedCount ?? 0,
      hint: "Failed attempts",
      status: "failed",
    },
    {
      label: "Total payouts",
      value: summary?.total ?? total,
      hint: "On record",
      status: "all",
    },
  ];

  const resetPage = () => setPage(1);

  const onStatusChange = (next) => {
    setStatus(next);
    resetPage();
  };

  const onMethodChange = (next) => {
    setMethod(next);
    resetPage();
  };

  const onDriverChange = (next) => {
    setDriverId(next);
    resetPage();
  };

  const onFromChange = (next) => {
    setFrom(next);
    resetPage();
  };

  const onToChange = (next) => {
    setTo(next);
    resetPage();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Payouts
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isPending
              ? "Loading payouts…"
              : status === "all"
                ? `${total} payout${total === 1 ? "" : "s"} on record`
                : `${total} ${status} payout${total === 1 ? "" : "s"}`}
          </p>
          <Link
            href="/payouts/batch/"
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            <FileCheck2 className="h-4 w-4" aria-hidden="true" />
            Review pending batch
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            aria-label="Filter payouts by status"
            className={controlClass}
          >
            <option value="all">All statuses</option>
            <option value="pending">Awaiting approval</option>
            <option value="processing">Processing</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={method}
            onChange={(event) => onMethodChange(event.target.value)}
            aria-label="Filter payouts by method"
            className={controlClass}
          >
            <option value="all">All methods</option>
            <option value="mobile_money">Mobile money</option>
            <option value="mpesa">M-Pesa</option>
            <option value="bank">Bank transfer</option>
            <option value="cash">Cash</option>
          </select>

          <select
            value={driverId}
            onChange={(event) => onDriverChange(event.target.value)}
            aria-label="Filter payouts by driver"
            className={`${controlClass} max-w-48`}
          >
            <option value="">All drivers</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={from}
            onChange={(event) => onFromChange(event.target.value)}
            aria-label="Payouts requested from"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />

          <input
            type="date"
            value={to}
            onChange={(event) => onToChange(event.target.value)}
            aria-label="Payouts requested until"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const active = status === card.status;

          return (
            <button
              key={card.label}
              type="button"
              onClick={() => onStatusChange(card.status)}
              aria-pressed={active}
              className={`cursor-pointer stat-card text-left transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
                active ? "ring-2 ring-brand-500" : "hover:shadow-md"
              }`}
            >
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                {card.label}
              </p>
              <p className="mt-1.5 text-lg font-bold tracking-tight sm:text-2xl text-slate-900">
                {card.value}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{card.hint}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 sm:px-5">
          <RefreshIndicator
            isFetching={isFetching}
            updatedAt={dataUpdatedAt}
            onRefresh={refetch}
          />
        </div>
        <Table className="min-w-full">
          <TableHeader className="bg-slate-50 [&_tr]:border-slate-200">
            <TableRow className="hover:bg-transparent">
              <TableHead>Driver</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="hidden lg:table-cell">Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden xl:table-cell">Reference</TableHead>
              <TableHead className="hidden lg:table-cell">Requested</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          {isPending && (
            <TableSkeleton
              rows={PAGE_SIZE}
              cols={7}
              mobileCols={4}
              lgCols={6}
            />
          )}

          {isError && (
            <TableBody>
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="p-0">
                  <QueryError error={error} onRetry={refetch} />
                </TableCell>
              </TableRow>
            </TableBody>
          )}

          {!isPending && !isError && (
            <TableBody>
              {payouts.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 sm:flex">
                        {payout.driverName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                      <span className="max-w-[5rem] truncate font-medium text-slate-900 sm:max-w-[8rem] lg:max-w-none">
                        {payout.driverName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">
                    {payout.amountLabel}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="block text-slate-700">
                      {payout.method}
                    </span>
                    {payout.methodDetails !== "—" && (
                      <span className="block text-xs text-slate-400">
                        {payout.methodDetails}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`badge ring-1 ring-inset ${
                        statusStyles[payout.status] ?? statusStyles.Pending
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${statusDots[payout.status] ?? statusDots.Pending}`}
                        aria-hidden="true"
                      />
                      {payout.status}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-xs text-slate-500 xl:table-cell">
                    {payout.reference}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {payout.requestedAt}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                          aria-label={`Actions for ${payout.driverName}`}
                        >
                          <EllipsisVertical
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-elevated ring-0"
                      >
                        <DropdownMenuItem
                          onSelect={() => setViewTarget(payout)}
                          className="px-2.5 py-1.5 text-xs font-medium text-slate-600 focus:bg-slate-50 focus:text-slate-700"
                        >
                          View
                        </DropdownMenuItem>
                        {payout.isSettled && (
                          <DropdownMenuItem
                            onSelect={() => {
                              try {
                                printPayoutReceipt(payout);
                              } catch (receiptError) {
                                toast.error(
                                  receiptError?.message ??
                                    "The receipt could not be opened.",
                                );
                              }
                            }}
                            className="px-2.5 py-1.5 text-xs font-medium text-slate-600 focus:bg-slate-50 focus:text-slate-700"
                          >
                            <FileDown className="h-4 w-4" aria-hidden="true" />
                            Print / save receipt as PDF
                          </DropdownMenuItem>
                        )}
                        {payout.canApprove && (
                          <>
                            <DropdownMenuSeparator className="bg-slate-100" />
                            <DropdownMenuItem
                              onSelect={() => {
                                setApproveNotes("");
                                setApproveTarget(payout);
                              }}
                              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 focus:bg-slate-50 focus:text-slate-700"
                            >
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => {
                                setRejectReason("");
                                setRejectTarget(payout);
                              }}
                              className="px-2.5 py-1.5 text-xs font-medium"
                            >
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        {payout.canRetry && (
                          <>
                            <DropdownMenuSeparator className="bg-slate-100" />
                            <DropdownMenuItem
                              onSelect={() => setRetryTarget(payout)}
                              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 focus:bg-slate-50 focus:text-slate-700"
                            >
                              Retry
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {payouts.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-slate-500"
                  >
                    No payouts match these filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          )}
        </Table>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3.5 sm:px-5">
          <p className="text-xs text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {payouts.length}
            </span>{" "}
            of <span className="font-semibold text-slate-700">{total}</span>
            {totalPages > 1 && (
              <>
                {" "}
                · Page{" "}
                <span className="font-semibold text-slate-700">
                  {page}
                </span> of{" "}
                <span className="font-semibold text-slate-700">
                  {totalPages}
                </span>
              </>
            )}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1 || isPlaceholderData}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-white"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages || isPlaceholderData}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-white"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <ViewPayoutPanel
        open={Boolean(viewTarget)}
        onClose={() => setViewTarget(null)}
        payout={viewTarget}
      />

      <ReasonDialog
        open={Boolean(approveTarget)}
        onClose={() => setApproveTarget(null)}
        title="Approve payout"
        description={
          approveTarget
            ? `${approveTarget.amountLabel} for ${approveTarget.driverName} will be released.`
            : undefined
        }
        confirmLabel="Approve payout"
        tone="default"
        label="Notes"
        optional
        placeholder="Anything the finance team should know (optional)"
        value={approveNotes}
        onChange={setApproveNotes}
        pending={approvePayout.isPending}
        onConfirm={async (notes) => {
          await approvePayout.mutateAsync({
            payoutId: approveTarget.id,
            notes,
          } as never);
          setApproveTarget(null);
        }}
      >
        <p className="text-sm text-slate-600">
          Add any context that should be recorded with this approval.
        </p>
      </ReasonDialog>

      <ReasonDialog
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        title="Reject payout"
        description={
          rejectTarget
            ? `${rejectTarget.amountLabel} for ${rejectTarget.driverName} will not be released.`
            : undefined
        }
        confirmLabel="Reject payout"
        label="Reason"
        tone="danger"
        placeholder="Why is this payout rejected?"
        value={rejectReason}
        onChange={setRejectReason}
        pending={rejectPayout.isPending}
        onConfirm={async (reason) => {
          await rejectPayout.mutateAsync({
            payoutId: rejectTarget.id,
            reason,
          } as never);
          setRejectTarget(null);
        }}
      >
        <p className="text-sm text-slate-600">
          Provide a reason so the rejection is documented for the finance team.
        </p>
      </ReasonDialog>

      <ConfirmDialog
        open={Boolean(retryTarget)}
        onClose={() => setRetryTarget(null)}
        title="Retry payout"
        description={
          retryTarget
            ? `${retryTarget.amountLabel} for ${retryTarget.driverName}`
            : undefined
        }
        confirmLabel="Retry payout"
        onConfirm={async () => {
          await retryPayout.mutateAsync({ payoutId: retryTarget.id } as never);
          setRetryTarget(null);
        }}
        pending={retryPayout.isPending}
      >
        <p className="text-sm text-slate-600">
          The payout goes back into the queue for another attempt. The driver is
          not notified until it succeeds.
        </p>
      </ConfirmDialog>
    </div>
  );
}

export default Payouts;
