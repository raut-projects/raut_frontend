"use client";

import { useMemo, useState } from "react";
import { Settings2 } from "lucide-react";

import { ConfigHistoryPanel } from "@/components/platformConfig/ConfigHistoryPanel";
import { ConfigSection } from "@/components/platformConfig/ConfigSection";
import {
  ConfigCard,
  ConfigSkeleton,
  TabActions,
} from "@/components/platformConfig/ConfigPrimitives";
import { useConfigForm } from "@/hooks/useConfigForm";
import {
  OPERATIONS_SECTIONS,
  isOperationsConfig,
  sectionsForRecords,
} from "@/lib/configRegistry";
import type { ConfigRecord } from "@/types/platformConfig";

export function OperationsTab({ configs }: { configs: ConfigRecord[] }) {
  const records = useMemo(() => configs.filter(isOperationsConfig), [configs]);
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
        title="Operations"
        description="No operational configuration was returned for this environment."
      >
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Settings2
            className="size-6 text-slate-400"
            strokeWidth={ 1.8 }
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-slate-700">
            Nothing to configure yet
          </p>
          <p className="max-w-sm text-xs text-slate-500">
            Operational limits will appear here once they are available in the
            config registry.
          </p>
        </div>
      </ConfigCard>
    );
  }

  if (!draft) {
    return (
      <ConfigCard title="Operations" description="Loading operations settings…">
        <ConfigSkeleton fields={ 6 } />
      </ConfigCard>
    );
  }

  const sections = sectionsForRecords(OPERATIONS_SECTIONS, records);

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
          onSave={ () => handleSave("Operations configuration saved.") }
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
