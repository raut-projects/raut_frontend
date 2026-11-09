"use client";

import { CheckCircle2, Copy, MessageSquare, Share2 } from "lucide-react";

import { ReferralDialog } from "@/components/marketing/ReferralDialog";
import { useToast } from "@/components/toastContext";
import { Button } from "@/components/ui/button";
import {
  buildReferralLink,
  REFERRAL_USER_TYPE_LABELS,
  type ReferralAssignableUser,
} from "@/lib/referralCodes";

export type ReferralCreatedDetails = {
  code: string;
  user: ReferralAssignableUser | null;
};

export function ReferralCreatedDialog({
  created,
  onClose,
}: {
  created: ReferralCreatedDetails | null;
  onClose: () => void;
}) {
  const toast = useToast();

  if (!created) return null;

  const link = buildReferralLink(created.code);
  const firstName = created.user?.name.split(/\s+/)[0] ?? "there";
  const message = `Hi ${firstName}, use my Raut referral code ${created.code} to sign up: ${link}`;

  const copy = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(message);
    } catch {
      toast.error("Could not copy to the clipboard.");
    }
  };

  const sendToUser = () => {
    if (created.user?.phone) {
      window.location.href = `sms:${created.user.phone}?body=${encodeURIComponent(
        message,
      )}`;
      return;
    }

    void copy(link, "Referral link copied. Send it to the assigned user.");
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Raut",
          text: `Use my referral code ${created.code} to sign up on Raut.`,
          url: link,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    void copy(link, "Referral link copied. You can share it now.");
  };

  return (
    <ReferralDialog
      open
      onClose={onClose}
      title="Referral Created"
      description="The code is ready to share with the assigned user."
      maxWidthClass="max-w-lg"
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
            onClick={() => void share()}
            className="h-10 border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Share2 className="size-4" aria-hidden="true" />
            Share Referral
          </Button>
          <Button
            type="button"
            onClick={sendToUser}
            className="h-10 bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <MessageSquare className="size-4" aria-hidden="true" />
            Send to User
          </Button>
        </>
      }
    >
      <div className="text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </span>
        <h3 className="mt-3 text-lg font-bold text-slate-900">
          Referral Created!
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Share the code or link with{" "}
          <span className="font-medium text-slate-700">
            {created.user?.name ?? "the assigned user"}
          </span>
          .
        </p>
      </div>

      <div className="mt-5 space-y-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Referral Code
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate font-mono text-lg font-bold tracking-wide text-slate-900">
              {created.code}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void copy(created.code, "Referral code copied.")}
              className="h-8 border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Copy className="size-3.5" aria-hidden="true" />
              Copy
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Assigned To
          </p>
          <p className="mt-1 text-sm font-medium text-slate-800">
            {created.user?.name ?? "Assigned user"}
          </p>
          {created.user && (
            <p className="mt-0.5 text-xs text-slate-500">
              {REFERRAL_USER_TYPE_LABELS[created.user.userType]}
              {created.user.phone ? ` · ${created.user.phone}` : ""}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Referral Link
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-xs text-slate-600">
              {link}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void copy(link, "Referral link copied.")}
              className="h-8 border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Copy className="size-3.5" aria-hidden="true" />
              Copy
            </Button>
          </div>
        </div>

        {created.user && !created.user.phone && (
          <p className="text-center text-[11px] text-slate-400">
            This user has no phone number, so Send to User copies the link
            instead.
          </p>
        )}
      </div>
    </ReferralDialog>
  );
}
