"use client";

import { cn } from "cn";

import {
  ConfigCard,
  ConfigField,
  ConfigSkeleton,
  TabActions,
} from "@/components/platformConfig/ConfigPrimitives";
import { QueryError } from "@/components/queryStates";
import { useToast } from "@/components/toastContext";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useConfigDraft } from "@/hooks/useConfigDraft";
import {
  useOperationsConfig,
  useUpdateOperationsConfig,
} from "@/hooks/usePlatformConfig";
import { AUTO_PAYOUT_OPTIONS, toOperationsDraft } from "@/lib/platformConfig";
import { operationsSchema, toFieldErrors } from "@/schemas/platformConfigSchemas";
import type {
  AutoPayoutSchedule,
  OperationsConfig,
} from "@/types/platformConfig";

export function OperationsTab() {
  const query = useOperationsConfig();
  const update = useUpdateOperationsConfig();
  const { success, error: toastError } = useToast();

  const {
    draft,
    setDraft,
    errors,
    setErrors,
    dirty,
    reset,
    markSaved,
  } = useConfigDraft(query.data, toOperationsDraft);

  const handleSave = async () => {
    if (!draft) return;

    const parsed = operationsSchema.safeParse(draft);

    if (!parsed.success) {
      const fieldErrors = toFieldErrors(parsed.error);
      setErrors(fieldErrors);
      toastError(
        Object.values(fieldErrors)[0] ?? "Check the highlighted fields.",
      );
      return;
    }

    setErrors({});

    try {
      await update.mutateAsync(parsed.data as OperationsConfig);
      markSaved();
      success("Operations configuration saved.");
    } catch (saveError) {
      toastError(
        saveError?.message ?? "Could not save the operations configuration.",
      );
    }
  };

  if (query.isPending) {
    return (
      <ConfigCard title="Operations" description="Loading operations settings…">
        <ConfigSkeleton fields={6} />
      </ConfigCard>
    );
  }

  if (query.isError) {
    return (
      <ConfigCard title="Operations">
        <QueryError error={query.error} onRetry={query.refetch} />
      </ConfigCard>
    );
  }

  if (!draft) return null;

  return (
    <div className="space-y-5">
      <ConfigCard
        title="Payouts"
        description="Control when driver payouts are released and the smallest amount that can be paid out."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <ConfigField
            label="Minimum payout (TZS)"
            htmlFor="min-payout"
            hint="1,000 – 50,000"
            error={errors.min_payout_amount_tzs}
          >
            <Input
              id="min-payout"
              type="number"
              min="1000"
              max="50000"
              step="500"
              value={draft.min_payout_amount_tzs}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  min_payout_amount_tzs: event.target.value,
                }))
              }
              className="h-10 border-slate-200 bg-white"
            />
          </ConfigField>

          <div>
            <p className="mb-1.5 text-xs font-semibold text-slate-600">
              Automatic payout schedule
            </p>
            <RadioGroup
              value={draft.auto_payout_schedule}
              onValueChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  auto_payout_schedule: value as AutoPayoutSchedule,
                }))
              }
              aria-label="Automatic payout schedule"
            >
              {AUTO_PAYOUT_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  htmlFor={`payout-${option.value}`}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                    draft.auto_payout_schedule === option.value
                      ? "border-brand-300 bg-brand-50"
                      : "border-slate-200 bg-white hover:bg-slate-50",
                  )}
                >
                  <RadioGroupItem
                    value={option.value}
                    id={`payout-${option.value}`}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {option.label}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {option.description}
                    </p>
                  </div>
                </label>
              ))}
            </RadioGroup>
            {errors.auto_payout_schedule && (
              <p className="mt-1.5 text-xs font-medium text-rose-600">
                {errors.auto_payout_schedule}
              </p>
            )}
          </div>
        </div>
      </ConfigCard>

      <ConfigCard
        title="System limits"
        description="Operational guardrails applied to requests, documents and admin sessions."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <ConfigField
            label="Document expiry reminder (days)"
            htmlFor="document-reminder"
            hint="7 – 90 days before expiry"
            error={errors.document_expiry_reminder_days}
          >
            <Input
              id="document-reminder"
              type="number"
              min="7"
              max="90"
              step="1"
              value={draft.document_expiry_reminder_days}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  document_expiry_reminder_days: event.target.value,
                }))
              }
              className="h-10 border-slate-200 bg-white"
            />
          </ConfigField>

          <ConfigField
            label="Maximum concurrent requests"
            htmlFor="max-concurrent"
            hint="1 – 5 ride requests per customer"
            error={errors.max_concurrent_requests}
          >
            <Input
              id="max-concurrent"
              type="number"
              min="1"
              max="5"
              step="1"
              value={draft.max_concurrent_requests}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  max_concurrent_requests: event.target.value,
                }))
              }
              className="h-10 border-slate-200 bg-white"
            />
          </ConfigField>

          <ConfigField
            label="Request timeout (seconds)"
            htmlFor="request-timeout"
            hint="10 – 120 seconds"
            error={errors.request_timeout_seconds}
          >
            <Input
              id="request-timeout"
              type="number"
              min="10"
              max="120"
              step="5"
              value={draft.request_timeout_seconds}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  request_timeout_seconds: event.target.value,
                }))
              }
              className="h-10 border-slate-200 bg-white"
            />
          </ConfigField>

          <ConfigField
            label="Session expiry (minutes)"
            htmlFor="session-expiry"
            hint="60 – 10,080 minutes (7 days)"
            error={errors.session_token_expiry_minutes}
          >
            <Input
              id="session-expiry"
              type="number"
              min="60"
              max="10080"
              step="60"
              value={draft.session_token_expiry_minutes}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  session_token_expiry_minutes: event.target.value,
                }))
              }
              className="h-10 border-slate-200 bg-white"
            />
          </ConfigField>
        </div>
      </ConfigCard>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        <TabActions
          dirty={dirty}
          isSaving={update.isPending}
          onSave={handleSave}
          onReset={reset}
        />
      </div>
    </div>
  );
}
