"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Gift,
  Pencil,
  Power,
  Trophy,
} from "lucide-react";

import { EditReferralDialog } from "@/components/marketing/EditReferralDialog";
import { MockDataBadge } from "@/components/marketing/MockDataBadge";
import { ReferralHistoryTable } from "@/components/marketing/ReferralHistoryTable";
import { ReferralLeaderboard } from "@/components/marketing/ReferralLeaderboard";
import { ReferralStatsCards } from "@/components/marketing/ReferralStatsCards";
import { QueryError } from "@/components/queryStates";
import { ConfirmDialog } from "@/components/reasonDialog";
import { useToast } from "@/components/toastContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useReferralOverview,
  useUpdateReferralConfig,
} from "@/hooks/useMarketing";
import {
  formatTzs,
  type ReferralConfig,
  type ReferralConfigFormValues,
} from "@/lib/marketing";
import { usePageViewField } from "@/store/pageViewStore";

function configToForm(config: ReferralConfig): ReferralConfigFormValues {
  return {
    status: config.status,
    referrerRewardTzs: String(config.referrerRewardTzs),
    refereeRewardTzs: String(config.refereeRewardTzs),
    maxReferralsPerUser: String(config.maxReferralsPerUser),
    rewardExpiryDays: String(config.rewardExpiryDays),
  };
}

export default function ReferralsPage() {
  const toast = useToast();
  const query = useReferralOverview("month");
  const update = useUpdateReferralConfig();
  const [editing, setEditing] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState<
    "active" | "inactive" | null
  >(null);
  const [expanded, setExpanded] = usePageViewField(
    "marketingReferrals",
    "expanded",
  );

  const overview = query.data;

  const submitConfig = async (values: ReferralConfigFormValues) => {
    try {
      await update.mutateAsync(values);
      toast.success("Referral program updated.");
      setEditing(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update the referral program.",
      );
    }
  };

  const changeStatus = async () => {
    if (!overview || !confirmStatus) return;

    try {
      await update.mutateAsync({
        ...configToForm(overview.config),
        status: confirmStatus,
      });
      toast.success(
        confirmStatus === "active"
          ? "Referral program activated."
          : "Referral program deactivated.",
      );
      setConfirmStatus(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not change the referral program status.",
      );
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Referral Program
          </h2>
          <MockDataBadge />
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Reward riders and drivers for inviting new users to Raut.
        </p>
      </div>

      {query.isError ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-card">
          <QueryError error={query.error} onRetry={query.refetch} />
        </div>
      ) : query.isPending || !overview ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-card"
              >
                <Skeleton className="h-3 w-24 bg-slate-200" />
                <Skeleton className="h-6 w-20 bg-slate-200" />
                <Skeleton className="h-3 w-32 bg-slate-100" />
              </div>
            ))}
          </div>
          <div className="h-52 rounded-xl border border-slate-200 bg-white shadow-card">
            <Skeleton className="m-5 h-40 w-[calc(100%-2.5rem)] bg-slate-100" />
          </div>
        </div>
      ) : (
        <>
          <ReferralStatsCards stats={overview.stats} />

          <div className="grid gap-4 lg:grid-cols-3">
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card lg:col-span-2">
              <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <Gift className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Program settings
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Applies to every new referral invite.
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                    overview.config.status === "active"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-100 text-slate-600"
                  }`}
                >
                  {overview.config.status === "active" ? "Active" : "Inactive"}
                </span>
              </header>

              <dl className="grid gap-5 px-5 py-5 sm:grid-cols-2">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Referrer reward
                  </dt>
                  <dd className="mt-1 text-lg font-bold text-slate-900">
                    {formatTzs(overview.config.referrerRewardTzs)}
                  </dd>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Paid after the invited user completes a first ride.
                  </p>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Referee reward
                  </dt>
                  <dd className="mt-1 text-lg font-bold text-slate-900">
                    {formatTzs(overview.config.refereeRewardTzs)}
                  </dd>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Credited to the new user&apos;s wallet.
                  </p>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Max referrals per user
                  </dt>
                  <dd className="mt-1 text-lg font-bold text-slate-900">
                    {overview.config.maxReferralsPerUser}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Reward expiry
                  </dt>
                  <dd className="mt-1 text-lg font-bold text-slate-900">
                    {overview.config.rewardExpiryDays} days
                  </dd>
                </div>
              </dl>

              <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirmStatus(
                    overview.config.status === "active" ? "inactive" : "active",
                  )}
                  className="h-9 border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Power className="size-4" aria-hidden="true" />
                  {overview.config.status === "active" ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="h-9 bg-brand-600 px-3.5 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Edit settings
                </Button>
              </footer>
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
              <header className="border-b border-slate-200 px-5 py-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Trophy className="size-4 text-amber-500" aria-hidden="true" />
                  Top referrers
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {overview.stats.periodLabel}
                </p>
              </header>
              <div className="px-4 py-2">
                <ReferralLeaderboard leaders={overview.topReferrers} />
              </div>
            </section>
          </div>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50"
            >
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Referral history
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Every referral, its status and the rewards paid out.
                </p>
              </div>
              {expanded ? (
                <ChevronUp
                  className="size-4 text-slate-400"
                  aria-hidden="true"
                />
              ) : (
                <ChevronDown
                  className="size-4 text-slate-400"
                  aria-hidden="true"
                />
              )}
            </button>
            {expanded && (
              <div className="border-t border-slate-200 px-4 py-5 sm:px-5">
                <ReferralHistoryTable />
              </div>
            )}
          </section>

          <EditReferralDialog
            open={editing}
            config={overview.config}
            isSubmitting={update.isPending}
            onClose={() => {
              if (!update.isPending) setEditing(false);
            }}
            onSubmit={submitConfig}
          />

          <ConfirmDialog
            open={Boolean(confirmStatus)}
            onClose={() => {
              if (!update.isPending) setConfirmStatus(null);
            }}
            title={
              confirmStatus === "active"
                ? "Activate referral program"
                : "Deactivate referral program"
            }
            description={
              confirmStatus === "active"
                ? "Riders will be able to share referral codes again and earn rewards."
                : "New referral codes cannot be shared while the program is inactive. Existing referrals keep their rewards."
            }
            confirmLabel={
              confirmStatus === "active" ? "Activate program" : "Deactivate"
            }
            tone={confirmStatus === "active" ? "brand" : "danger"}
            pending={update.isPending}
            onConfirm={changeStatus}
          />
        </>
      )}
    </div>
  );
}
