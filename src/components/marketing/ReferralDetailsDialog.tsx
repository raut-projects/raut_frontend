"use client";

import type { ReactNode } from "react";
import { Copy, Link2 } from "lucide-react";

import { ReferralDialog } from "@/components/marketing/ReferralDialog";
import { ReferralStatusBadge } from "@/components/marketing/ReferralStatusBadge";
import { useToast } from "@/components/toastContext";
import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/clipboard";
import { formatReferralDate, formatTzs } from "@/lib/marketing";
import {
  buildReferralLink,
  REFERRAL_REWARD_TYPE_LABELS,
  REFERRAL_USER_TYPE_LABELS,
  type ReferralCode,
} from "@/lib/referralCodes";

const USER_TYPE_CLASSES = {
  rider: "border-sky-200 bg-sky-50 text-sky-700",
  driver: "border-violet-200 bg-violet-50 text-violet-700",
};

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-slate-700">{value}</dd>
    </div>
  );
}

export function ReferralDetailsDialog({
  code,
  onClose,
}: {
  code: ReferralCode | null;
  onClose: () => void;
}) {
  const toast = useToast();

  if (!code) return null;

  const link = buildReferralLink(code.code);

  const copy = async (value: string, message: string) => {
    try {
      await copyToClipboard(value);
      toast.success(message);
    } catch {
      toast.error("Could not copy to the clipboard.");
    }
  };

  return (
    <ReferralDialog
      open
      onClose={onClose}
      title="Referral Details"
      description="Complete information for this referral code."
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-10 border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Close
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void copy(link, "Referral link copied.")}
            className="h-10 border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Link2 className="size-4" aria-hidden="true" />
            Copy Link
          </Button>
          <Button
            type="button"
            onClick={() => void copy(code.code, "Referral code copied.")}
            className="h-10 bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Copy className="size-4" aria-hidden="true" />
            Copy Code
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-slate-900 px-2 py-1 font-mono text-sm font-semibold tracking-wide text-white">
              {code.code}
            </span>
            <ReferralStatusBadge status={code.status} />
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${USER_TYPE_CLASSES[code.userType]}`}
            >
              {REFERRAL_USER_TYPE_LABELS[code.userType]}
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-900">{code.name}</p>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <Detail label="Assigned User" value={code.assignedUserName} />
          <Detail
            label="Phone"
            value={code.assignedUserPhone || "Not provided"}
          />
          <Detail
            label="Email"
            value={code.assignedUserEmail || "Not provided"}
          />
          <Detail
            label="Reward Type"
            value={REFERRAL_REWARD_TYPE_LABELS[code.rewardType]}
          />
          <Detail
            label="Referrer Reward"
            value={formatTzs(code.referrerRewardTzs)}
          />
          <Detail
            label="New User Reward"
            value={formatTzs(code.newUserRewardTzs)}
          />
          <Detail label="Rewards Paid" value={formatTzs(code.rewardsTzs)} />
          <Detail
            label="Usage"
            value={`${code.uses.toLocaleString("en-US")} of ${code.maxUses.toLocaleString("en-US")}`}
          />
          <Detail
            label="Pending Referrals"
            value={code.pendingReferrals.toLocaleString("en-US")}
          />
          <Detail
            label="Starts"
            value={
              code.startDate
                ? formatReferralDate(code.startDate)
                : "Not provided"
            }
          />
          <Detail
            label="Expiry"
            value={
              code.expiryDate ? formatReferralDate(code.expiryDate) : "No expiry"
            }
          />
          <Detail label="Created" value={formatReferralDate(code.createdAt)} />
        </dl>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Referral Link
          </p>
          <p className="mt-1 break-all text-xs text-slate-600">{link}</p>
        </div>
      </div>
    </ReferralDialog>
  );
}
