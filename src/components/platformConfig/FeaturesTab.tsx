"use client";

import {
  ConfigCard,
  ConfigSkeleton,
  TabActions,
} from "@/components/platformConfig/ConfigPrimitives";
import { QueryError } from "@/components/queryStates";
import { useToast } from "@/components/toastContext";
import { Switch } from "@/components/ui/switch";
import { useConfigDraft } from "@/hooks/useConfigDraft";
import { useFeatureFlags, useUpdateFeatureFlags } from "@/hooks/usePlatformConfig";
import { toFeatureFlagsDraft } from "@/lib/platformConfig";
import { featureFlagsSchema } from "@/schemas/platformConfigSchemas";
import type { FeatureFlags } from "@/types/platformConfig";

const FEATURES: {
  key: keyof FeatureFlags;
  name: string;
  description: string;
  badge?: string;
}[] = [
  {
    key: "scheduled_rides",
    name: "Scheduled rides",
    description:
      "Let customers book a ride in advance instead of requesting one immediately.",
  },
  {
    key: "duo",
    name: "DUO rides",
    description:
      "Match customers travelling in the same direction so they can share a ride.",
    badge: "DUO",
  },
  {
    key: "ratings",
    name: "Ratings",
      description:
        "Collect a rating from customers for the driver after each completed trip.",
  },
  {
    key: "in_app_chat",
    name: "In-app chat",
    description:
      "Allow customers and drivers to message each other while a trip is active.",
  },
  {
    key: "corporate_accounts",
    name: "Corporate accounts",
    description:
      "Enable company accounts with consolidated billing for employees.",
  },
];

export function FeaturesTab() {
  const query = useFeatureFlags();
  const update = useUpdateFeatureFlags();
  const { success, error: toastError } = useToast();

  const { draft, setDraft, dirty, reset, markSaved } = useConfigDraft(
    query.data,
    toFeatureFlagsDraft,
  );

  const handleSave = async () => {
    if (!draft) return;

    const parsed = featureFlagsSchema.safeParse(draft);

    if (!parsed.success) {
      toastError("Check the feature flags before saving.");
      return;
    }

    try {
      await update.mutateAsync(parsed.data);
      markSaved();
      success("Feature flags saved.");
    } catch (saveError) {
      toastError(
        saveError?.message ?? "Could not save the feature flags.",
      );
    }
  };

  if (query.isPending) {
    return (
      <ConfigCard
        title="Feature flags"
        description="Loading feature settings…"
      >
        <ConfigSkeleton fields={4} />
      </ConfigCard>
    );
  }

  if (query.isError) {
    return (
      <ConfigCard title="Feature flags">
        <QueryError error={query.error} onRetry={query.refetch} />
      </ConfigCard>
    );
  }

  if (!draft) return null;

  return (
    <div className="space-y-5">
      <ConfigCard
        title="Feature flags"
        description="Turn platform capabilities on or off. Changes apply to new requests after saving."
      >
        <div className="divide-y divide-slate-200">
          {FEATURES.map((feature) => (
            <div
              key={feature.key}
              className="flex items-start justify-between gap-5 py-4 first:pt-0 last:pb-0"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {feature.name}
                  </p>
                  {feature.badge && (
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-brand-700">
                      {feature.badge}
                    </span>
                  )}
                </div>
                <p className="mt-1 max-w-2xl text-xs text-slate-500">
                  {feature.description}
                </p>
              </div>

              <Switch
                checked={draft[feature.key]}
                onCheckedChange={(checked) =>
                  setDraft((current) => ({
                    ...current,
                    [feature.key]: checked,
                  }))
                }
                aria-label={`Toggle ${feature.name}`}
              />
            </div>
          ))}
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
