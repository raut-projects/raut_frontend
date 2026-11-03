"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ArrowLeft, CircleAlert, ShieldAlert } from "lucide-react";
import {
  QueryError,
  RefreshIndicator,
  TableSkeleton,
} from "@/components/queryStates";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import SidePanel from "@/components/SidePanel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/reasonDialog";
import { useToast } from "@/components/toastContext";
import { useApprovePayoutBatch } from "@/hooks/useAdminActions";
import { usePayoutBatchReview } from "@/hooks/usePayouts";
import { formatMoney } from "@/services/mappers";

const HIGH_VALUE_LIMIT = 50_000;

const processingStatusStyles = {
  Queued: "bg-slate-100 text-slate-600 ring-slate-500/20",
  Processing: "bg-brand-50 text-brand-700 ring-brand-600/20",
  Approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Failed: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

function BatchStatus({ status }) {
  const label = status ? status[0].toUpperCase() + status.slice(1) : "Queued";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        processingStatusStyles[label] ?? processingStatusStyles.Queued
      }`}
    >
      {label}
    </span>
  );
}

function PayoutBatchReview() {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [batchActivity, setBatchActivity] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [twoFactorNoticeOpen, setTwoFactorNoticeOpen] = useState(false);
  const [isCheckingBatch, setIsCheckingBatch] = useState(false);
  const batchActionInProgress = useRef(false);
  const {
    data: reviewData = { pending: [], processing: [] },
    isPending,
    isError,
    error,
    isFetching,
    dataUpdatedAt,
    refetch,
  } = usePayoutBatchReview();
  const payouts = reviewData.pending;
  const processingPayouts = reviewData.processing;
  const approveBatch = useApprovePayoutBatch();
  const toast = useToast();

  const eligiblePayouts = useMemo(
    () =>
      payouts.filter(
        (payout) => payout.id !== null && payout.issues.length === 0,
      ),
    [payouts],
  );
  const selectedPayouts = payouts.filter((payout) =>
    selectedIds.has(String(payout.id)),
  );
  const selectedEligiblePayouts = selectedPayouts.filter(
    (payout) => payout.id !== null && payout.issues.length === 0,
  );
  const selectedAmount = selectedEligiblePayouts.reduce(
    (total, payout) => total + payout.amount,
    0,
  );
  const selectedEligibleCount = selectedEligiblePayouts.length;
  const completedCount = batchActivity.filter(
    (payout) => payout.status === "approved" || payout.status === "failed",
  ).length;

  const togglePayout = (payoutId) => {
    const key = String(payoutId);
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleEligiblePayouts = () => {
    setSelectedIds((current) =>
      eligiblePayouts.every((payout) => current.has(String(payout.id)))
        ? new Set()
        : new Set(eligiblePayouts.map((payout) => String(payout.id))),
    );
  };

  const openApprovalConfirmation = () => {
    if (selectedEligibleCount === 0) return;

    if (selectedAmount > HIGH_VALUE_LIMIT) {
      setTwoFactorNoticeOpen(true);
      return;
    }

    setConfirmOpen(true);
  };

  const processBatch = async () => {
    if (batchActionInProgress.current) return;

    batchActionInProgress.current = true;
    setIsCheckingBatch(true);
    try {
      const selectedKeys = new Set(selectedIds);
      const latest = await refetch();
      const latestPayouts = latest.data?.pending ?? [];
      const currentSelection = latestPayouts.filter((payout) =>
        selectedKeys.has(String(payout.id)),
      );

      if (
        currentSelection.length !== selectedKeys.size ||
        currentSelection.some((payout) => payout.issues.length > 0)
      ) {
        setConfirmOpen(false);
        setSelectedIds(new Set());
        toast.error(
          "The pending payout list changed. Review the refreshed list and select payouts again.",
        );
        return;
      }

      const currentAmount = currentSelection.reduce(
        (total, payout) => total + payout.amount,
        0,
      );
      if (currentAmount > HIGH_VALUE_LIMIT) {
        setConfirmOpen(false);
        setTwoFactorNoticeOpen(true);
        return;
      }

      setConfirmOpen(false);
      setSelectedIds(new Set());
      setBatchActivity(
        currentSelection.map((payout) => ({ ...payout, status: "queued" })),
      );

      await approveBatch.mutateAsync({
        payouts: currentSelection.map((payout) => ({
          id: payout.id,
          driverName: payout.driverName,
          amount: payout.amount,
        })),
        onProgress: (progress) => {
          setBatchActivity((current) =>
            current.map((payout) =>
              String(payout.id) === String(progress.payoutId)
                ? { ...payout, ...progress }
                : payout,
            ),
          );
        },
      });
    } catch (batchError) {
      toast.error(
        batchError?.message ?? "The payout batch could not be completed.",
      );
    } finally {
      batchActionInProgress.current = false;
      setIsCheckingBatch(false);
    }
  };

  const retryApproval = async (activityPayout) => {
    if (batchActionInProgress.current) return;

    batchActionInProgress.current = true;
    setIsCheckingBatch(true);
    try {
      const latest = await refetch();
      const payout = (latest.data?.pending ?? []).find(
        (item) => String(item.id) === String(activityPayout.id),
      );

      if (!payout || payout.issues.length > 0) {
        toast.error(
          "This payout is no longer eligible for batch approval. Review its current status before trying again.",
        );
        return;
      }

      setBatchActivity((current) =>
        current.map((item) =>
          String(item.id) === String(payout.id)
            ? { ...item, status: "queued", message: undefined }
            : item,
        ),
      );

      await approveBatch.mutateAsync({
        payouts: [
          {
            id: payout.id,
            driverName: payout.driverName,
            amount: payout.amount,
          },
        ],
        onProgress: (progress) => {
          setBatchActivity((current) =>
            current.map((item) =>
              String(item.id) === String(progress.payoutId)
                ? { ...item, ...progress }
                : item,
            ),
          );
        },
      });
    } catch (retryError) {
      toast.error(retryError?.message ?? "The payout could not be approved.");
    } finally {
      batchActionInProgress.current = false;
      setIsCheckingBatch(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Link
          href="/payouts/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to payouts
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Batch review
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review pending payouts and approve eligible items together.
          </p>
        </div>
      </div>

      <section aria-label="Batch totals" className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
          <p className="text-sm font-medium text-slate-500">Pending payouts</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
            {isPending ? "…" : payouts.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
          <p className="text-sm font-medium text-slate-500">Pending total</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
            {isPending
              ? "…"
              : formatMoney(
                  payouts.reduce((total, payout) => total + payout.amount, 0),
                )}
          </p>
        </div>
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
          <p className="text-sm font-medium text-brand-700">
            Selected for approval
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
            {selectedEligibleCount} · {formatMoney(selectedAmount)}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <Checkbox
              aria-label="Select all eligible payouts"
              checked={
                eligiblePayouts.length > 0 &&
                eligiblePayouts.every((payout) =>
                  selectedIds.has(String(payout.id)),
                )
              }
              onCheckedChange={toggleEligiblePayouts}
              disabled={
                isPending ||
                eligiblePayouts.length === 0 ||
                approveBatch.isPending ||
                isCheckingBatch
              }
            />
            <span className="text-sm font-semibold text-slate-700">
              Select eligible payouts
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <RefreshIndicator
              isFetching={isFetching}
              updatedAt={dataUpdatedAt}
              onRefresh={refetch}
            />
            <Button
              type="button"
              onClick={openApprovalConfirmation}
              disabled={
                selectedEligibleCount === 0 ||
                selectedEligibleCount !== selectedIds.size ||
                approveBatch.isPending ||
                isCheckingBatch
              }
              className="bg-brand-600 text-white hover:bg-brand-700"
            >
              {approveBatch.isPending
                ? `Processing ${completedCount} of ${batchActivity.length}`
                : "Approve batch"}
            </Button>
          </div>
        </div>

        {approveBatch.isPending && (
          <p
            className="border-b border-brand-100 bg-brand-50 px-4 py-2 text-sm text-brand-800"
            role="status"
            aria-live="polite"
          >
            Approvals are being sent one at a time. This page will refresh as
            each request completes.
          </p>
        )}

        <div className="overflow-x-auto">
          <Table className="min-w-[760px]">
            <TableHeader className="bg-slate-50 [&_tr]:border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10" />
                <TableHead>Driver</TableHead>
                <TableHead>Phone verification</TableHead>
                <TableHead>Previous failures</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>

            {isPending && <TableSkeleton rows={5} cols={6} mobileCols={4} />}

            {isError && (
              <TableBody>
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="p-0">
                    <QueryError error={error} onRetry={refetch} />
                  </TableCell>
                </TableRow>
              </TableBody>
            )}

            {!isPending && !isError && (
              <TableBody>
                {payouts.map((payout) => {
                  const key =
                    payout.id === null || payout.id === undefined
                      ? `${payout.driverId}:${payout.requestedAt}:${payout.amount}`
                      : String(payout.id);
                  const hasIssues = payout.issues.length > 0;
                  const idIsValid =
                    payout.id !== null && payout.id !== undefined;

                  return (
                    <TableRow key={key}>
                      <TableCell>
                        <Checkbox
                          aria-label={`Select payout for ${payout.driverName}`}
                          checked={selectedIds.has(String(payout.id))}
                          onCheckedChange={() => togglePayout(payout.id)}
                          disabled={
                            hasIssues || !idIsValid || approveBatch.isPending
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-slate-900">
                          {payout.driverName}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {payout.driverPhone}
                        </p>
                      </TableCell>
                      <TableCell>
                        {payout.phoneVerified === true ? (
                          <span className="text-sm font-medium text-emerald-700">
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700">
                            <CircleAlert
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                            {payout.phoneVerified === false
                              ? "Unverified"
                              : "Not provided"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {payout.previousFailureCount > 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-700">
                            <CircleAlert
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                            {payout.previousFailureCount}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-500">
                            None found
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold tabular-nums text-slate-900">
                        {payout.amountLabel}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <span className="badge bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20">
                            {payout.status}
                          </span>
                          {hasIssues && (
                            <p className="max-w-64 text-xs text-rose-700">
                              {payout.issues.join("; ")}. Excluded from batch
                              approval.
                            </p>
                          )}
                          {!idIsValid && (
                            <p className="text-xs text-rose-700">
                              Missing payout ID. Cannot approve.
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {payouts.length === 0 && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={6}
                      className="py-12 text-center text-sm text-slate-500"
                    >
                      No pending payouts need review.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            )}
          </Table>
        </div>
        <div className="flex items-start gap-2 border-t border-slate-200 px-4 py-3 text-xs text-slate-500 sm:px-5">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            Payouts with unverified or unavailable phone verification, or with
            previous failures, are excluded from batch approval. Review them
            individually from the payouts page.
          </p>
        </div>
      </section>

      {processingPayouts.length > 0 && (
        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-900">
              Approved and processing
            </h2>
            <p className="text-xs text-slate-500">
              Status refreshes every 10 seconds
            </p>
          </div>
          <ul className="divide-y divide-slate-100">
            {processingPayouts.map((payout) => (
              <li
                key={String(payout.id)}
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {payout.driverName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatMoney(payout.amount)}
                    {payout.reference !== "—" ? ` · ${payout.reference}` : ""}
                  </p>
                </div>
                <BatchStatus
                  status={
                    payout.statusKey === "approved" ? "approved" : "processing"
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {batchActivity.length > 0 && (
        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900">
              Latest batch activity
            </h2>
            <span className="text-xs text-slate-500" aria-live="polite">
              {completedCount} of {batchActivity.length} completed
            </span>
          </div>
          <ul className="divide-y divide-slate-100">
            {batchActivity.map((payout) => (
              <li
                key={String(payout.id)}
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {payout.driverName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatMoney(payout.amount)}
                    {payout.message ? ` · ${payout.message}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <BatchStatus status={payout.status} />
                  {payout.status === "failed" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => retryApproval(payout)}
                      disabled={approveBatch.isPending || isCheckingBatch}
                    >
                      Try again
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {payouts.some((payout) => payout.issues.length > 0) && (
        <div className="sr-only" role="status">
          {payouts.filter((payout) => payout.issues.length > 0).length} pending
          payouts have issues and are excluded from batch approval.
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Approve selected payouts"
        description={`${selectedEligibleCount} payouts totaling ${formatMoney(selectedAmount)} will be approved.`}
        confirmLabel="Approve batch"
        onConfirm={processBatch}
        pending={approveBatch.isPending || isCheckingBatch}
      >
        <p className="text-sm text-slate-600">
          Each payout is approved separately. If one fails, the remaining
          approvals will continue and the failed item will be listed for review.
        </p>
      </ConfirmDialog>

      <SidePanel
        open={twoFactorNoticeOpen}
        onClose={() => setTwoFactorNoticeOpen(false)}
        title="Additional verification required"
        description={`This batch totals ${formatMoney(selectedAmount)}. Batches over ${formatMoney(HIGH_VALUE_LIMIT)} require step-up verification.`}
        footer={
          <Button
            type="button"
            variant="outline"
            onClick={() => setTwoFactorNoticeOpen(false)}
          >
            Close
          </Button>
        }
      >
        <div className="space-y-3 text-sm text-slate-600">
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-amber-900">
            <ShieldAlert
              className="mt-0.5 h-5 w-5 shrink-0"
              aria-hidden="true"
            />
            <p>
              High-value batch approval is blocked. The backend does not yet
              provide a secure second-factor verification endpoint, so no
              approval request was sent.
            </p>
          </div>
          <p>
            Connect a server-verified second-factor flow before enabling this
            approval. A code entered only in the browser would not protect these
            payouts.
          </p>
        </div>
      </SidePanel>
    </div>
  );
}

export default PayoutBatchReview;
