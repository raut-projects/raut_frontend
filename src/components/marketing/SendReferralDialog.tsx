"use client";

import { useState } from "react";
import { Mail, MessageSquare, Send } from "lucide-react";

import { ReferralDialog } from "@/components/marketing/ReferralDialog";
import { useToast } from "@/components/toastContext";
import { Button } from "@/components/ui/button";
import { useSendReferralCode } from "@/hooks/useMarketing";
import type { ReferralCode, ReferralSendChannel } from "@/lib/referralCodes";

const channelClass =
  "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors";

export function SendReferralDialog({
  code,
  onClose,
}: {
  code: ReferralCode;
  onClose: () => void;
}) {
  const toast = useToast();
  const send = useSendReferralCode();
  const [channel, setChannel] = useState<ReferralSendChannel>(() =>
    code.assignedUserPhone ? "sms" : "email",
  );

  const hasPhone = Boolean(code.assignedUserPhone);
  const hasEmail = Boolean(code.assignedUserEmail);
  const canSend = hasPhone || hasEmail;
  const selectedContact =
    channel === "sms" ? code.assignedUserPhone : code.assignedUserEmail;

  const handleClose = () => {
    if (!send.isPending) onClose();
  };

  const handleSend = () => {
    if (send.isPending || !canSend) return;

    send.mutate(
      { codeId: code.id, channel },
      {
        onSuccess: () => {
          toast.success(
            `Referral sent to ${code.assignedUserName} by ${channel === "sms" ? "SMS" : "email"}.`,
          );
          onClose();
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : "Could not send the referral.",
          );
        },
      },
    );
  };

  return (
    <ReferralDialog
      open
      onClose={handleClose}
      title="Send to User"
      description={`Send ${code.code} to the assigned user.`}
      maxWidthClass="max-w-lg"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={send.isPending}
            className="h-10 border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={send.isPending || !canSend}
            className="h-10 bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Send className="size-4" aria-hidden="true" />
            {send.isPending ? "Sending…" : "Send Referral"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">
            {code.assignedUserName}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            The referral code and signup link will be sent to this user.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-600">Send via</p>

          <button
            type="button"
            onClick={() => setChannel("sms")}
            disabled={!hasPhone}
            aria-pressed={channel === "sms"}
            className={`${channelClass} ${
              channel === "sms" && hasPhone
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
                {code.assignedUserPhone || "No phone number available"}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setChannel("email")}
            disabled={!hasEmail}
            aria-pressed={channel === "email"}
            className={`${channelClass} ${
              channel === "email" && hasEmail
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
                {code.assignedUserEmail || "No email address available"}
              </span>
            </span>
          </button>
        </div>

        {!canSend ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            This user has no phone number or email address, so the referral
            cannot be sent.
          </p>
        ) : (
          <p className="text-center text-[11px] text-slate-400">
            Sending to {selectedContact} via {channel === "sms" ? "SMS" : "email"}.
          </p>
        )}
      </div>
    </ReferralDialog>
  );
}
