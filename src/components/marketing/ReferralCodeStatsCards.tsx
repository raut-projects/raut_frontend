import { Gift, Share2, Users, Wallet } from "lucide-react";

import { formatTzs } from "@/lib/marketing";
import type { ReferralCodeStats } from "@/lib/referralCodes";

const cards = [
  {
    key: "totalCodes",
    label: "Total Codes",
    note: "All referral codes",
    icon: Gift,
    value: (stats: ReferralCodeStats) =>
      stats.totalCodes.toLocaleString("en-US"),
  },
  {
    key: "assigned",
    label: "Assigned",
    note: "Linked to a rider or driver",
    icon: Users,
    value: (stats: ReferralCodeStats) =>
      stats.assigned.toLocaleString("en-US"),
  },
  {
    key: "successfulReferrals",
    label: "Successful Referrals",
    note: "Completed referrals",
    icon: Share2,
    value: (stats: ReferralCodeStats) =>
      stats.successfulReferrals.toLocaleString("en-US"),
  },
  {
    key: "rewardsPaidTzs",
    label: "Rewards Paid",
    note: "Across completed referrals",
    icon: Wallet,
    value: (stats: ReferralCodeStats) => formatTzs(stats.rewardsPaidTzs),
  },
] as const;

export function ReferralCodeStatsCards({
  stats,
}: {
  stats: ReferralCodeStats;
}) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.key}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-card"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {card.label}
                </p>
                <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
                  {card.value(stats)}
                </p>
              </div>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <Icon className="size-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">{card.note}</p>
          </div>
        );
      })}
    </section>
  );
}
