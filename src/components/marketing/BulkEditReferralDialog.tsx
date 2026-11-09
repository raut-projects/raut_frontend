"use client";

import { useId, useState, type FormEvent } from "react";

import { ReferralDialog } from "@/components/marketing/ReferralDialog";
import { useToast } from "@/components/toastContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  useBulkUpdateReferralCodes,
  type ReferralBulkResult,
} from "@/hooks/useMarketing";
import {
  defaultReferralExpiryDate,
  toReferralCodeBulkUpdatePayload,
  type ReferralCode,
} from "@/lib/referralCodes";
import { referralCodeBulkEditSchema } from "@/schemas/marketingSchemas";

const labelClass = "mb-1.5 block text-xs font-semibold text-slate-600";
const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";
const errorClass = "mt-1 block text-xs font-medium text-rose-600";

export function BulkEditReferralDialog({
  codes,
  onClose,
  onFinished,
}: {
  codes: ReferralCode[];
  onClose: () => void;
  onFinished?: (result: ReferralBulkResult) => void;
}) {
  const toast = useToast();
  const formId = `bulk-edit-referrals-${useId()}`;
  const bulkUpdate = useBulkUpdateReferralCodes();
  const maxCompletedUses = Math.max(0, ...codes.map((code) => code.uses));
  const defaultMaxUses = Math.max(1, ...codes.map((code) => code.maxUses));
  const [updateExpiry, setUpdateExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState(defaultReferralExpiryDate);
  const [updateMaxUses, setUpdateMaxUses] = useState(false);
  const [maxUses, setMaxUses] = useState(String(defaultMaxUses));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleClose = () => {
    if (!bulkUpdate.isPending) onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (bulkUpdate.isPending) return;

    const result = referralCodeBulkEditSchema.safeParse({
      updateExpiry,
      expiryDate,
      updateMaxUses,
      maxUses,
    });

    if (!result.success) {
      const nextErrors: Record<string, string> = {};

      for (const issue of result.error.issues) {
        const field = String(issue.path[0] ?? "form");
        if (!nextErrors[field]) nextErrors[field] = issue.message;
      }

      setErrors(nextErrors);
      return;
    }

    const payload = toReferralCodeBulkUpdatePayload(result.data);

    if (
      payload.max_uses !== undefined &&
      payload.max_uses < maxCompletedUses
    ) {
      setErrors({
        maxUses: `Maximum uses cannot be lower than the ${maxCompletedUses} completed use${maxCompletedUses === 1 ? "" : "s"} across the selected codes.`,
      });
      return;
    }

    try {
      const outcome = await bulkUpdate.mutateAsync({ codes, payload });

      if (outcome.succeeded.length > 0) {
        toast.success(
          `${outcome.succeeded.length} referral code${outcome.succeeded.length === 1 ? "" : "s"} updated.`,
        );
      }

      if (outcome.failed.length > 0) {
        toast.error(
          `${outcome.failed.length} referral code${outcome.failed.length === 1 ? "" : "s"} could not be updated. ${outcome.failed[0]?.message ?? ""}`.trim(),
        );
      }

      onFinished?.(outcome);
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update the referral codes.",
      );
    }
  };

  return (
    <ReferralDialog
      open
      onClose={handleClose}
      title="Edit selected referrals"
      description={`Update settings for ${codes.length} selected referral code${codes.length === 1 ? "" : "s"}.`}
      maxWidthClass="max-w-lg"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={bulkUpdate.isPending}
            className="h-10 border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={bulkUpdate.isPending}
            className="h-10 bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
          >
            {bulkUpdate.isPending ? "Saving." : "Save Changes"}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        onSubmit={(event) => void handleSubmit(event)}
        noValidate
        className="space-y-4"
      >
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">
            {codes.length} code{codes.length === 1 ? "" : "s"} selected
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Highest completed uses: {maxCompletedUses.toLocaleString("en-US")}.
            Only the settings you enable will change.
          </p>
        </div>

        {errors.form && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
            {errors.form}
          </p>
        )}

        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <label className="flex items-start gap-3">
              <Checkbox
                checked={updateExpiry}
                onCheckedChange={(checked) => {
                  setUpdateExpiry(checked === true);
                  setErrors({});
                }}
                className="mt-0.5"
                aria-label="Update expiry date"
              />
              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  Update expiry date
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  Apply the same expiry date to every selected code.
                </span>
              </span>
            </label>

            {updateExpiry && (
              <label className="mt-3 block">
                <span className={labelClass}>Expiry Date</span>
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(event) => {
                    setExpiryDate(event.target.value);
                    setErrors((previous) => {
                      if (!previous.expiryDate) return previous;
                      const next = { ...previous };
                      delete next.expiryDate;
                      return next;
                    });
                  }}
                  aria-invalid={Boolean(errors.expiryDate)}
                  className={inputClass}
                />
                {errors.expiryDate && (
                  <span className={errorClass}>{errors.expiryDate}</span>
                )}
              </label>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <label className="flex items-start gap-3">
              <Checkbox
                checked={updateMaxUses}
                onCheckedChange={(checked) => {
                  setUpdateMaxUses(checked === true);
                  setErrors({});
                }}
                className="mt-0.5"
                aria-label="Update maximum uses"
              />
              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  Update maximum uses
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  Apply the same usage limit to every selected code.
                </span>
              </span>
            </label>

            {updateMaxUses && (
              <label className="mt-3 block">
                <span className={labelClass}>Maximum Uses</span>
                <Input
                  type="number"
                  min={Math.max(1, maxCompletedUses)}
                  max={1000}
                  step={1}
                  value={maxUses}
                  onChange={(event) => {
                    setMaxUses(event.target.value);
                    setErrors((previous) => {
                      if (!previous.maxUses) return previous;
                      const next = { ...previous };
                      delete next.maxUses;
                      return next;
                    });
                  }}
                  aria-invalid={Boolean(errors.maxUses)}
                  className={inputClass}
                />
                {errors.maxUses ? (
                  <span className={errorClass}>{errors.maxUses}</span>
                ) : (
                  <span className="mt-1 block text-[11px] text-slate-400">
                    Must be at least the highest completed use count.
                  </span>
                )}
              </label>
            )}
          </div>
        </div>
      </form>
    </ReferralDialog>
  );
}
