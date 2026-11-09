"use client";

import { useEffect, useId, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type {
  ReferralConfig,
  ReferralConfigFormValues,
} from "@/lib/marketing";
import { referralConfigSchema } from "@/schemas/marketingSchemas";

const fieldClass =
  "h-10 bg-white text-sm text-slate-700 focus-visible:border-brand-400 focus-visible:ring-brand-100";

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-semibold text-slate-600"
      >
        {label}
      </Label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

function errorText(
  errors: ReturnType<typeof useForm<ReferralConfigFormValues>>["formState"]["errors"],
  key: keyof ReferralConfigFormValues,
) {
  const message = errors[key]?.message;

  return typeof message === "string" ? message : undefined;
}

export function EditReferralDialog({
  open,
  config,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  open: boolean;
  config: ReferralConfig;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: ReferralConfigFormValues) => Promise<void>;
}) {
  const headingId = useId();

  const form = useForm<ReferralConfigFormValues>({
    resolver: zodResolver(referralConfigSchema),
    defaultValues: {
      status: config.status,
      referrerRewardTzs: String(config.referrerRewardTzs),
      refereeRewardTzs: String(config.refereeRewardTzs),
      maxReferralsPerUser: String(config.maxReferralsPerUser),
      rewardExpiryDays: String(config.rewardExpiryDays),
    },
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (!open) return;

    reset({
      status: config.status,
      referrerRewardTzs: String(config.referrerRewardTzs),
      refereeRewardTzs: String(config.refereeRewardTzs),
      maxReferralsPerUser: String(config.maxReferralsPerUser),
      rewardExpiryDays: String(config.rewardExpiryDays),
    });
  }, [config, open, reset]);

  useEffect(() => {
    if (!open) return undefined;

    const browserDocument = window.document;
    const previousOverflow = browserDocument.body.style.overflow;
    browserDocument.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      browserDocument.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSubmitting, onClose, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id={headingId} className="text-base font-semibold text-slate-900">
              Edit referral program
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Changes apply to referrals created after saving.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close referral program dialog"
          >
            <X aria-hidden="true" />
          </Button>
        </header>

        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit(async (values) => {
              await onSubmit(values);
            })();
          }}
        >
          <div className="space-y-5 px-5 py-5">
            <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Program active
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  When inactive, new referral codes cannot be shared.
                </p>
              </div>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Switch
                    checked={field.value === "active"}
                    onCheckedChange={(checked) =>
                      field.onChange(checked ? "active" : "inactive")
                    }
                    aria-label="Referral program active"
                  />
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Referrer reward (TZS)"
                htmlFor="referrer-reward"
                error={errorText(errors, "referrerRewardTzs")}
              >
                <Input
                  id="referrer-reward"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className={fieldClass}
                  aria-invalid={Boolean(errorText(errors, "referrerRewardTzs"))}
                  {...register("referrerRewardTzs")}
                />
              </Field>

              <Field
                label="Referee reward (TZS)"
                htmlFor="referee-reward"
                error={errorText(errors, "refereeRewardTzs")}
              >
                <Input
                  id="referee-reward"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className={fieldClass}
                  aria-invalid={Boolean(errorText(errors, "refereeRewardTzs"))}
                  {...register("refereeRewardTzs")}
                />
              </Field>

              <Field
                label="Max referrals per user"
                htmlFor="max-referrals"
                error={errorText(errors, "maxReferralsPerUser")}
              >
                <Input
                  id="max-referrals"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={1000}
                  step={1}
                  className={fieldClass}
                  aria-invalid={Boolean(
                    errorText(errors, "maxReferralsPerUser"),
                  )}
                  {...register("maxReferralsPerUser")}
                />
              </Field>

              <Field
                label="Reward expiry (days)"
                htmlFor="reward-expiry"
                error={errorText(errors, "rewardExpiryDays")}
              >
                <Input
                  id="reward-expiry"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={365}
                  step={1}
                  className={fieldClass}
                  aria-invalid={Boolean(errorText(errors, "rewardExpiryDays"))}
                  {...register("rewardExpiryDays")}
                />
              </Field>
            </div>

            <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">
              Rewards are credited to the wallet after the referee completes
              their first ride.
            </p>
          </div>

          <footer className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-10 border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="animate-spin" aria-hidden="true" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
