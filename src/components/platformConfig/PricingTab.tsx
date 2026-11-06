"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

import {
  ConfigCard,
  ConfigField,
  ConfigSkeleton,
  TabActions,
} from "@/components/platformConfig/ConfigPrimitives";
import { FareCalculator } from "@/components/platformConfig/FareCalculator";
import { PeakHoursPanel } from "@/components/platformConfig/PeakHoursPanel";
import { QueryError } from "@/components/queryStates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConfigDraft } from "@/hooks/useConfigDraft";
import { usePricingConfig, useUpdatePricingConfig } from "@/hooks/usePlatformConfig";
import { formatPeakHoursLabel, toPricingDraft } from "@/lib/platformConfig";
import { pricingSchema, toFieldErrors } from "@/schemas/platformConfigSchemas";
import { useToast } from "@/components/toastContext";
import type { PricingConfig, PricingDraft } from "@/types/platformConfig";

export function PricingTab() {
  const query = usePricingConfig();
  const update = useUpdatePricingConfig();
  const { success, error: toastError } = useToast();
  const [peakHoursOpen, setPeakHoursOpen] = useState(false);

  const {
    draft,
    setDraft,
    errors,
    setErrors,
    dirty,
    reset,
    markSaved,
  } = useConfigDraft(query.data, toPricingDraft);

  const updateField = (key: keyof PricingDraft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    if (!draft) return;

    const parsed = pricingSchema.safeParse(draft);

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
      await update.mutateAsync(parsed.data as PricingConfig);
      markSaved();
      success("Pricing configuration saved.");
    } catch (saveError) {
      toastError(
        saveError?.message ?? "Could not save the pricing configuration.",
      );
    }
  };

  if (query.isPending) {
    return (
      <ConfigCard title="Pricing" description="Loading pricing settings…">
        <ConfigSkeleton fields={6} />
      </ConfigCard>
    );
  }

  if (query.isError) {
    return (
      <ConfigCard title="Pricing">
        <QueryError error={query.error} onRetry={query.refetch} />
      </ConfigCard>
    );
  }

  if (!draft) return null;

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="space-y-5">
          <ConfigCard
            title="Trip rates"
            description="The base fare and distance/time rates used to calculate every trip."
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <ConfigField
                label="Base fare (TZS)"
                htmlFor="base-fare"
                hint="500 – 10,000"
                error={errors.base_fare_tzs}
              >
                <Input
                  id="base-fare"
                  type="number"
                  min="500"
                  max="10000"
                  step="50"
                  value={draft.base_fare_tzs}
                  onChange={(event) =>
                    updateField("base_fare_tzs", event.target.value)
                  }
                  className="h-10 border-slate-200 bg-white"
                />
              </ConfigField>

              <ConfigField
                label="Price per km (TZS)"
                htmlFor="price-per-km"
                hint="100 – 5,000"
                error={errors.price_per_km_tzs}
              >
                <Input
                  id="price-per-km"
                  type="number"
                  min="100"
                  max="5000"
                  step="50"
                  value={draft.price_per_km_tzs}
                  onChange={(event) =>
                    updateField("price_per_km_tzs", event.target.value)
                  }
                  className="h-10 border-slate-200 bg-white"
                />
              </ConfigField>

              <ConfigField
                label="Price per minute (TZS)"
                htmlFor="price-per-minute"
                hint="10 – 1,000"
                error={errors.price_per_minute_tzs}
              >
                <Input
                  id="price-per-minute"
                  type="number"
                  min="10"
                  max="1000"
                  step="10"
                  value={draft.price_per_minute_tzs}
                  onChange={(event) =>
                    updateField("price_per_minute_tzs", event.target.value)
                  }
                  className="h-10 border-slate-200 bg-white"
                />
              </ConfigField>
            </div>
          </ConfigCard>

          <ConfigCard
            title="Platform & DUO"
            description="Commission held by the platform and the discount rules for DUO rides."
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <ConfigField
                label="Platform fee (%)"
                htmlFor="platform-fee"
                hint="0 – 50"
                error={errors.platform_fee_percent}
              >
                <Input
                  id="platform-fee"
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={draft.platform_fee_percent}
                  onChange={(event) =>
                    updateField("platform_fee_percent", event.target.value)
                  }
                  className="h-10 border-slate-200 bg-white"
                />
              </ConfigField>

              <ConfigField
                label="DUO discount (%)"
                htmlFor="duo-discount"
                hint="0 – 50"
                error={errors.duo_discount_percent}
              >
                <Input
                  id="duo-discount"
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={draft.duo_discount_percent}
                  onChange={(event) =>
                    updateField("duo_discount_percent", event.target.value)
                  }
                  className="h-10 border-slate-200 bg-white"
                />
              </ConfigField>

              <ConfigField
                label="DUO distribution (%)"
                htmlFor="duo-distribution"
                hint="30 – 70"
                error={errors.duo_distribution_percent}
              >
                <Input
                  id="duo-distribution"
                  type="number"
                  min="30"
                  max="70"
                  step="1"
                  value={draft.duo_distribution_percent}
                  onChange={(event) =>
                    updateField("duo_distribution_percent", event.target.value)
                  }
                  className="h-10 border-slate-200 bg-white"
                />
              </ConfigField>
            </div>
          </ConfigCard>

          <ConfigCard
            title="Peak hours"
            description="Time windows that receive the configured surge."
            action={
              <Button
                type="button"
                variant="outline"
                onClick={() => setPeakHoursOpen(true)}
                className="h-9 border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Pencil />
                Edit hours
              </Button>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <ConfigField
                label="Peak-hour surge (%)"
                htmlFor="peak-surge"
                hint="0 – 100"
                error={errors.peak_hour_surge_percent}
              >
                <Input
                  id="peak-surge"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={draft.peak_hour_surge_percent}
                  onChange={(event) =>
                    updateField("peak_hour_surge_percent", event.target.value)
                  }
                  className="h-10 border-slate-200 bg-white"
                />
              </ConfigField>

              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                <p className="text-xs font-semibold text-slate-600">
                  Configured windows
                </p>
                <p className="mt-1 text-sm text-slate-800">
                  {formatPeakHoursLabel(draft.peak_hours)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {draft.peak_hours.filter((slot) => slot.enabled).length}{" "}
                  enabled window
                  {draft.peak_hours.filter((slot) => slot.enabled).length === 1
                    ? ""
                    : "s"}
                </p>
              </div>
            </div>

            {errors.peak_hours && (
              <p className="mt-3 text-xs font-medium text-rose-600">
                {errors.peak_hours}
              </p>
            )}
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

        <FareCalculator
          baseFare={draft.base_fare_tzs}
          pricePerKm={draft.price_per_km_tzs}
          pricePerMinute={draft.price_per_minute_tzs}
          surgePercent={draft.peak_hour_surge_percent}
        />
      </div>

      {peakHoursOpen && (
        <PeakHoursPanel
          open
          onClose={() => setPeakHoursOpen(false)}
          slots={draft.peak_hours}
          onChange={(slots) =>
            setDraft((current) => ({ ...current, peak_hours: slots }))
          }
        />
      )}
    </>
  );
}
