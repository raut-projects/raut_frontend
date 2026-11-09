import type { ReactNode } from "react";
import {
  CheckCircle2,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { formatTzs, type ReferralStats } from "@/lib/marketing";

function StatCard({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${tone}`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-2 text-xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function ReferralStatsCards({ stats }: { stats: ReferralStats }) {
  const conversion =
    stats.totalReferrals > 0
      ? Math.round((stats.successfulReferrals / stats.totalReferrals) * 100)
      : 0;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total referrals"
        value={stats.totalReferrals.toLocaleString("en-US")}
        hint={`${stats.periodLabel} · ${conversion}% converted`}
        icon={<Users className="size-4" aria-hidden="true" />}
        tone="bg-sky-50 text-sky-600"
      />
      <StatCard
        label="Successful referrals"
        value={stats.successfulReferrals.toLocaleString("en-US")}
        hint={
          stats.averageRidesPerUser !== undefined
            ? `${stats.averageRidesPerUser.toFixed(1)} avg rides per new user`
            : "Completed first rides"
        }
        icon={<CheckCircle2 className="size-4" aria-hidden="true" />}
        tone="bg-emerald-50 text-emerald-600"
      />
      <StatCard
        label="Rewards paid"
        value={formatTzs(stats.rewardsPaidTzs)}
        hint={`New user LTV ${formatTzs(stats.newUserLtvTzs)}`}
        icon={<Wallet className="size-4" aria-hidden="true" />}
        tone="bg-amber-50 text-amber-600"
      />
      <StatCard
        label="Program ROI"
        value={`${stats.roiPercent.toFixed(1)}%`}
        hint="Value generated vs rewards paid"
        icon={<TrendingUp className="size-4" aria-hidden="true" />}
        tone="bg-brand-50 text-brand-700"
      />
    </div>
  );
}
