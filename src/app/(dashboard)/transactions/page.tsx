"use client";

import { useState } from "react";
import {
  QueryError,
  RefreshIndicator,
  TableSkeleton,
} from "@/components/queryStates";
import {
  useTransactionSummary,
  useTransactions,
} from "@/hooks/useTransactions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePageViewField } from "@/store/pageViewStore";
import { useClampPage } from "@/hooks/useClampPage";

const statusStyles = {
  Pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Processing: "bg-brand-50 text-brand-700 ring-brand-600/20",
  Completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Failed: "bg-rose-50 text-rose-700 ring-rose-600/20",
  Cancelled: "bg-slate-100 text-slate-600 ring-slate-500/20",
  Refunded: "bg-slate-100 text-slate-600 ring-slate-500/20",
  Reversed: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

const statusDots = {
  Pending: "bg-amber-500",
  Processing: "bg-brand-500",
  Completed: "bg-emerald-500",
  Failed: "bg-rose-500",
  Cancelled: "bg-slate-400",
  Refunded: "bg-slate-400",
  Reversed: "bg-rose-500",
};

const typeStyles = {
  Payment: "bg-brand-50 text-brand-700",
  "Ride Payment": "bg-brand-50 text-brand-700",
  Fare: "bg-brand-50 text-brand-700",
  Payout: "bg-violet-50 text-violet-700",
  Withdrawal: "bg-violet-50 text-violet-700",
  Refund: "bg-amber-50 text-amber-700",
  Commission: "bg-slate-100 text-slate-700",
  Fee: "bg-slate-100 text-slate-700",
  "Top Up": "bg-emerald-50 text-emerald-700",
  Deposit: "bg-emerald-50 text-emerald-700",
};

const PAGE_SIZE = 10;

const controlClass =
  "rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";

function Transactions() {
  const [status, setStatus] = usePageViewField("transactions", "status");
  const [type, setType] = usePageViewField("transactions", "type");
  const [from, setFrom] = usePageViewField("transactions", "from");
  const [to, setTo] = usePageViewField("transactions", "to");
  const [page, setPage] = usePageViewField("transactions", "page");

  const params = { status, type, from, to, page, limit: PAGE_SIZE };

  const {
    data,
    isPending,
    isError,
    error,
    isFetching,
    isPlaceholderData,
    dataUpdatedAt,
    refetch,
  } = useTransactions(params);

  const { data: summary, isPending: summaryPending } = useTransactionSummary();

  const transactions = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useClampPage(page, totalPages, setPage);

  const summaryCards = [
    {
      label: "Total transactions",
      value: summary?.total ?? 0,
      hint: "On record",
      status: "all",
      type: "all",
    },
    {
      label: "Pending",
      value: summary?.pending ?? 0,
      hint: "In progress",
      status: "pending",
      type: "all",
    },
    {
      label: "Completed",
      value: summary?.completed ?? 0,
      hint: "Successful",
      status: "completed",
      type: "all",
    },
    {
      label: "Failed",
      value: summary?.failed ?? 0,
      hint: "Failed/Cancelled",
      status: "failed",
      type: "all",
    },
  ];

  const resetPage = () => setPage(1);

  const onStatusChange = (next) => {
    setStatus(next);
    resetPage();
  };

  const onTypeChange = (next) => {
    setType(next);
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
            Transactions
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isPending
              ? "Loading transactions…"
              : status === "all"
                ? `${total} transaction${total === 1 ? "" : "s"} on record`
                : `${total} ${status} transaction${total === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            aria-label="Filter transactions by status"
            className={controlClass}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>

          <select
            value={type}
            onChange={(event) => onTypeChange(event.target.value)}
            aria-label="Filter transactions by type"
            className={controlClass}
          >
            <option value="all">All types</option>
            <option value="payment">Payment</option>
            <option value="payout">Payout</option>
            <option value="refund">Refund</option>
            <option value="commission">Commission</option>
            <option value="fee">Fee</option>
          </select>

          <input
            type="date"
            value={from}
            onChange={(event) => onFromChange(event.target.value)}
            aria-label="Transactions from"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />

          <input
            type="date"
            value={to}
            onChange={(event) => onToChange(event.target.value)}
            aria-label="Transactions until"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const active = status === card.status && type === card.type;

          return (
            <button
              key={card.label}
              type="button"
              onClick={() => {
                setStatus(card.status);
                setType(card.type);
                resetPage();
              }}
              aria-pressed={active}
              className={`cursor-pointer stat-card text-left transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
                active ? "ring-2 ring-brand-500" : "hover:shadow-md"
              }`}
            >
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                {card.label}
              </p>
              <p className="mt-1.5 text-lg font-bold tracking-tight sm:text-2xl text-slate-900">
                {summaryPending ? "-" : card.value}
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
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead className="hidden lg:table-cell">Name</TableHead>
              <TableHead className="hidden lg:table-cell">Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Date</TableHead>
              <TableHead className="hidden xl:table-cell">
                Description
              </TableHead>
            </TableRow>
          </TableHeader>

          {isPending && (
            <TableSkeleton
              rows={PAGE_SIZE}
              cols={7}
              mobileCols={3}
              lgCols={6}
            />
          )}

          {isError && (
            <TableBody>
              <TableRow>
                <TableCell colSpan={7}>
                  <QueryError error={error} onRetry={refetch} />
                </TableCell>
              </TableRow>
            </TableBody>
          )}

          {!isPending && !isError && (
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <span className="block max-w-[5rem] truncate font-medium text-slate-900 sm:max-w-none">
                      {transaction.reference}
                    </span>
                    <span className="block max-w-[5rem] truncate text-xs text-slate-400 lg:hidden">
                      {transaction.userName}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="block text-slate-900">
                      {transaction.userName}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        typeStyles[transaction.type] ??
                        "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {transaction.type || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">
                    {transaction.amountLabel}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`badge ring-1 ring-inset ${
                        statusStyles[transaction.status] ?? statusStyles.Pending
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          statusDots[transaction.status] ?? statusDots.Pending
                        }`}
                        aria-hidden="true"
                      />
                      {transaction.status}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="block text-slate-900">
                      {transaction.created}
                    </span>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <span className="block max-w-[16rem] truncate text-slate-700">
                      {transaction.description || "—"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-sm text-slate-500"
                  >
                    No transactions match these filters.
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
              {transactions.length}
            </span>{" "}
            of <span className="font-semibold text-slate-700">{total}</span>
            {totalPages > 1 && (
              <>
                {" "}
                - Page{" "}
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
    </div>
  );
}

export default Transactions;
