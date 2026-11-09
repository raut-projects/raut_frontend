"use client";

import { useId, useState, type FormEvent } from "react";

import { ReferralDialog } from "@/components/marketing/ReferralDialog";
import { useToast } from "@/components/toastContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateReferralCode } from "@/hooks/useMarketing";
import {
  defaultReferralExpiryDate,
  toReferralCodeUpdatePayload,
  type ReferralCode,
  type ReferralCodeEditFormValues,
} from "@/lib/referralCodes";
import { referralCodeEditSchema } from "@/schemas/marketingSchemas";

const labelClass = "mb-1.5 block text-xs font-semibold text-slate-600";
const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";
const errorClass = "mt-1 block text-xs font-medium text-rose-600";

export function EditReferralDialog({
  code,
  onClose,
}: {
  code: ReferralCode;
  onClose: () => void;
}) {
  const toast = useToast();
  const formId = `edit-referral-${useId()}`;
  const update = useUpdateReferralCode();
  const [values, setValues] = useState<ReferralCodeEditFormValues>(() => ({
    maxUses: String(code.maxUses),
    expiryDate: code.expiryDate.slice(0, 10) || defaultReferralExpiryDate(),
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setField = <Field extends keyof ReferralCodeEditFormValues>(
    field: Field,
    value: ReferralCodeEditFormValues[Field],
  ) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

  const handleClose = () => {
    if (!update.isPending) onClose();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (update.isPending) return;

    const result = referralCodeEditSchema.safeParse(values);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors(
        Object.fromEntries(
          Object.entries(fieldErrors)
            .filter(([, messages]) => messages && messages.length > 0)
            .map(([field, messages]) => [field, messages?.[0] ?? ""]),
        ),
      );
      return;
    }

    if (Number(result.data.maxUses) < code.uses) {
      setErrors({
        maxUses: `Maximum uses cannot be lower than the ${code.uses} completed use${code.uses === 1 ? "" : "s"}.`,
      });
      return;
    }

    update.mutate(
      { code, payload: toReferralCodeUpdatePayload(result.data) },
      {
        onSuccess: () => {
          toast.success(`${code.code} updated.`);
          onClose();
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : "Could not update the referral code.",
          );
        },
      },
    );
  };

  return (
    <ReferralDialog
      open
      onClose={handleClose}
      title="Edit Referral"
      description={`Update the permitted settings for ${code.code}.`}
      maxWidthClass="max-w-lg"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={update.isPending}
            className="h-10 border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={update.isPending}
            className="h-10 bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
          >
            {update.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-sm font-semibold tracking-wide text-slate-900">
              {code.code}
            </span>
            <span className="text-xs text-slate-500">
              {code.uses.toLocaleString("en-US")} completed use
              {code.uses === 1 ? "" : "s"}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Status changes are handled through Activate and Deactivate.
          </p>
        </div>

        <label className="block">
          <span className={labelClass}>Maximum Uses</span>
          <Input
            type="number"
            min={Math.max(1, code.uses)}
            max={1000}
            step={1}
            value={values.maxUses}
            onChange={(event) => setField("maxUses", event.target.value)}
            aria-invalid={Boolean(errors.maxUses)}
            className={inputClass}
          />
          {errors.maxUses ? (
            <span className={errorClass}>{errors.maxUses}</span>
          ) : (
            <span className="mt-1 block text-[11px] text-slate-400">
              Must be at least the completed use count.
            </span>
          )}
        </label>

        <label className="block">
          <span className={labelClass}>Expiry Date</span>
          <Input
            type="date"
            value={values.expiryDate}
            onChange={(event) => setField("expiryDate", event.target.value)}
            aria-invalid={Boolean(errors.expiryDate)}
            className={inputClass}
          />
          {errors.expiryDate && (
            <span className={errorClass}>{errors.expiryDate}</span>
          )}
        </label>
      </form>
    </ReferralDialog>
  );
}
