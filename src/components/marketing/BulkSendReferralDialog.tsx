"use client";

import { useState } from "react";
import { Mail, MessageSquare, Send } from "lucide-react";

import { ReferralDialog } from "@/components/marketing/ReferralDialog";
import { useToast } from "@/components/toastContext";
import { Button } from "@/components/ui/button";
import {
  useBulkSendReferralCodes,
  type ReferralBulkResult,
} from "@/hooks/useMarketing";
import type { ReferralCode, ReferralSendChannel } from "@/lib/referralCodes";

const channelClass =
  "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors";

export function BulkSendReferralDialog({
  codes,
  onClose,
  onFinished,
}: {
  codes: ReferralCode[];
  onClose: () => void;
  onFinished?: (result: ReferralBulkResult) => void;
}) {
  const toast = useToast();
  const bulkSend = useBulkSendReferralCodes();
  const phoneRecipients = codes.filter((code) => code.assignedUserPhone);
  const emailRecipients = codes.filter((code) => code.assignedUserEmail);
  const [channel, setChannel] = useState<ReferralSendChannel>(() =>
    phoneRecipients.length > 0 ? "sms" : "email",
  );
  const recipients = channel === "sms" ? phoneRecipients : emailRecipients;
  const skippedCount = codes.length - recipients.length;
  const canSend = recipients.length > 0;

  const handleClose = () => {
    if (!bulkSend.isPending) onClose();
  };

  const handleSend = async () => {
    if (bulkSend.isPending || !canSend) return;

    try {
      const outcome = await bulkSend.mutateAsync({
        codes: recipients,
        channel,
      });

      if (outcome.succeeded.length > 0) {
        toast.success(
          `Referral sent to ${outcome.succeeded.length} user${outcome.succeeded.length === 1 ? "" : "s"} by ${channel === "sms" ? "SMS" : "email"}.`,
        );
      }

      if (outcome.failed.length > 0) {
        toast.error(
          `${outcome.failed.length} referral${outcome.failed.length === 1 ? "" : "s"} could not be sent. ${outcome.failed[0]?.message ?? ""}`.trim(),
        );
      }

      if (skippedCount > 0) {
        toast.toast(
          `${skippedCount} selected user${skippedCount === 1 ? "" : "s"} skipped because they have no ${channel === "sms" ? "phone number" : "email address"}.`,
          "info",
        );
      }

      onFinished?.(outcome);
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not send the referral codes.",
      );
    }
  };

  return (
    <ReferralDialog
      open
      onClose={handleClose}
      title="Send selected referrals"
      description={`Send referral codes to ${codes.length} selected user${codes.length === 1 ? "" : "s"}.`}
      maxWidthClass="max-w-lg"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={bulkSend.isPending}
            className="h-10 border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSend()}
            disabled={bulkSend.isPending || !canSend}
            className="h-10 bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Send className="size-4" aria-hidden="true" />
            {bulkSend.isPending
              ? "Sending."
              : `Send to ${recipients.length}`}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">
            {codes.length} code{codes.length === 1 ? "" : "s"} selected
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Each user receives the referral code assigned to them.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-600">Send via</p>

          <button
            type="button"
            onClick={() => setChannel("sms")}
            disabled={phoneRecipients.length === 0}
            aria-pressed={channel === "sms"}
            className={`${channelClass} ${
              channel === "sms" && phoneRecipients.length > 0
                ? "border-brand-300 bg-brand-50"
                : "border-slate-200 bg-white hover:bg-slate-50"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm">
              <MessageSquare className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-800">
                SMS
              </span>
              <span className="mt-0.5 block truncate text-xs text-slate-500">
                {phoneRecipients.length} recipient
                {phoneRecipients.length === 1 ? "" : "s"} with a phone number
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setChannel("email")}
            disabled={emailRecipients.length === 0}
            aria-pressed={channel === "email"}
            className={`${channelClass} ${
              channel === "email" && emailRecipients.length > 0
                ? "border-brand-300 bg-brand-50"
                : "border-slate-200 bg-white hover:bg-slate-50"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm">
              <Mail className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-800">
                Email
              </span>
              <span className="mt-0.5 block truncate text-xs text-slate-500">
                {emailRecipients.length} recipient
                {emailRecipients.length === 1 ? "" : "s"} with an email address
              </span>
            </span>
          </button>
        </div>

        {!canSend ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            None of the selected users have a {channel === "sms" ? "phone number" : "email address"}, so the referrals cannot be sent.
          </p>
        ) : (
          <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
            {recipients.length} recipient{recipients.length === 1 ? "" : "s"} will receive the message
            {skippedCount > 0
              ? `; ${skippedCount} will be skipped for missing contact details`
              : ""}
            .
          </p>
        )}
      </div>
    </ReferralDialog>
  );
}
