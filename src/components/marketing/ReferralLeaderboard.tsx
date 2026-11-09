"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, Trophy } from "lucide-react";

import { usePageViewStore } from "@/store/pageViewStore";
import { formatTzs, type ReferralLeader } from "@/lib/marketing";

const TYPE_LABELS: Record<ReferralLeader["userType"], string> = {
  rider: "Rider",
  driver: "Driver",
  other: "User",
};

export function ReferralLeaderboard({
  leaders,
}: {
  leaders: ReferralLeader[];
}) {
  const router = useRouter();

  const openLeader = (leader: ReferralLeader) => {
    if (leader.id.startsWith("leader-")) return;

    if (leader.userType === "driver") {
      router.push(`/drivers/${encodeURIComponent(leader.id)}`);
      return;
    }

    if (leader.userType === "rider") {
      usePageViewStore
        .getState()
        .setField("customers", "search", leader.name);
      usePageViewStore.getState().setField("customers", "page", 1);
      router.push("/customers");
    }
  };

  if (!leaders.length) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        No referrals recorded yet this period.
      </p>
    );
  }

  return (
    <ol className="divide-y divide-slate-100">
      {leaders.slice(0, 10).map((leader, index) => {
        const clickable =
          !leader.id.startsWith("leader-") &&
          (leader.userType === "driver" || leader.userType === "rider");

        return (
          <li key={leader.id}>
            <button
              type="button"
              onClick={() => openLeader(leader)}
              disabled={!clickable}
              className="flex w-full items-center gap-3 px-1 py-3 text-left transition-colors enabled:hover:bg-slate-50 disabled:cursor-default"
            >
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  index === 0
                    ? "bg-amber-100 text-amber-700"
                    : index === 1
                      ? "bg-slate-200 text-slate-700"
                      : index === 2
                        ? "bg-orange-100 text-orange-700"
                        : "bg-slate-100 text-slate-500"
                }`}
              >
                {index < 3 ? (
                  <Trophy className="size-3.5" aria-hidden="true" />
                ) : (
                  index + 1
                )}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {leader.name}
                </p>
                <p className="text-xs text-slate-500">
                  {TYPE_LABELS[leader.userType]} · {leader.referrals} referral
                  {leader.referrals === 1 ? "" : "s"}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">
                  {formatTzs(leader.rewardsTzs)}
                </p>
                <p className="text-[11px] text-slate-400">earned</p>
              </div>

              {clickable && (
                <ChevronRight
                  className="size-4 shrink-0 text-slate-300"
                  aria-hidden="true"
                />
              )}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
