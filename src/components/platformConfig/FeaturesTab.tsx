"use client";

import { useMemo, useState } from "react";
import { ToggleRight } from "lucide-react";

import { ConfigHistoryPanel } from "@/components/platformConfig/ConfigHistoryPanel";
import { ConfigSection } from "@/components/platformConfig/ConfigSection";
import {
  ConfigCard,
  ConfigSkeleton,
  TabActions,
} from "@/components/platformConfig/ConfigPrimitives";
import { useConfigForm } from "@/hooks/useConfigForm";
import {
  FEATURE_SECTION,
  isFeatureConfig,
  sectionsForRecords,
} from "@/lib/configRegistry";
import type { ConfigRecord } from "@/types/platformConfig";

export function FeaturesTab({ configs }: { configs: ConfigRecord[] }) {
  const records = useMemo(() => configs.filter(isFeatureConfig), [configs]);
  const {
    draft,
    errors,
    dirty,
    isSaving,
    handleSave,
    reset,
    setDraft,
    setErrors,
  } = useConfigForm(records);
  const [historyKey, setHistoryKey] = useState<string | null>(null);

  const historyRecord =
    records.find((record) => record.key === historyKey) ?? null;

  const handleChange = (key: string, value: string | boolean) => {
    setDraft((current) => ({ ...current, [key]: value }));

    if (errors[key]) {
      const next = { ...errors };
      delete next[key];
      setErrors(next);
    }
  };

  if (!records.length) {
    return (
      <ConfigCard
        title="Feature flags"
        description="No feature flags were returned for this environment."
      >
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <ToggleRight
            className="size-6 text-slate-400"
            strokeWidth={ 1.8 }
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-slate-700">
            Nothing to configure yet
          </p>
          <p className="max-w-sm text-xs text-slate-500">
            Feature flags will appear here once they are available in the config
            registry.
          </p>
        </div>
      </ConfigCard>
    );
  }

  if (!draft) {
    return (
      <ConfigCard title="Feature flags" description="Loading feature settings…">
        <ConfigSkeleton fields={ 4 } />
      </ConfigCard>
    );
  }

  const sections = sectionsForRecords([FEATURE_SECTION], records);

  return (
    <div className="space-y-5">
      { sections.map((section) => (
        <ConfigSection
          key={ section.id }
          section={ section }
          records={ records }
          draft={ draft }
          errors={ errors }
          onChange={ handleChange }
          onShowHistory={ setHistoryKey }
        />
      )) }

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        <TabActions
          dirty={ dirty }
          isSaving={ isSaving }
          onSave={ () => handleSave("Feature flags saved.") }
          onReset={ reset }
        />
      </div>

      <ConfigHistoryPanel
        record={ historyRecord }
        open={ Boolean(historyKey) }
        onClose={ () => setHistoryKey(null) }
      />
    </div>
  );
}
