"use client";

import { useMemo, useState } from "react";
import { Info, Settings2, ShieldCheck } from "lucide-react";

import { ConfigHistoryPanel } from "@/components/platformConfig/ConfigHistoryPanel";
import { ConfigSection } from "@/components/platformConfig/ConfigSection";
import {
  ConfigCard,
  ConfigSkeleton,
  TabActions,
} from "@/components/platformConfig/ConfigPrimitives";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useConfigForm } from "@/hooks/useConfigForm";
import {
  LATRA_SECTION,
  OPERATIONS_SECTIONS,
  isLATRAConfig,
  isOperationsConfig,
  sectionsForRecords,
} from "@/lib/configRegistry";
import type { ConfigRecord } from "@/types/platformConfig";

type OperationsTabId = "operations" | "latra";

const makeHandleChange = (form: ReturnType<typeof useConfigForm>) =>
  (key: string, value: string | boolean) => {
    form.setDraft((current) => ({ ...current, [key]: value }));

    if (form.errors[key]) {
      const next = { ...form.errors };
      delete next[key];
      form.setErrors(next);
    }
  };

export function OperationsTab({ configs }: { configs: ConfigRecord[] }) {
  const operationsRecords = useMemo(
    () => configs.filter(isOperationsConfig),
    [configs],
  );
  const latraRecords = useMemo(() => configs.filter(isLATRAConfig), [configs]);
  const allRecords = useMemo(
    () => [...operationsRecords, ...latraRecords],
    [operationsRecords, latraRecords],
  );
  const operationsForm = useConfigForm(operationsRecords);
  const latraForm = useConfigForm(latraRecords);
  const [activeTab, setActiveTab] = useState<OperationsTabId>("operations");
  const [historyKey, setHistoryKey] = useState<string | null>(null);

  const operationsSections = useMemo(
    () => sectionsForRecords(OPERATIONS_SECTIONS, operationsRecords),
    [operationsRecords],
  );
  const latraSections = useMemo(
    () => sectionsForRecords([LATRA_SECTION], latraRecords),
    [latraRecords],
  );

  const operationsDraft = operationsForm.draft;
  const latraDraft = latraForm.draft;
  const historyRecord =
    allRecords.find((record) => record.key === historyKey) ?? null;
  const handleOperationsChange = makeHandleChange(operationsForm);
  const handleLatraChange = makeHandleChange(latraForm);

  if (!allRecords.length) {
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
            Operational and LATRA compliance settings will appear here once
            they are available in the config registry.
          </p>
        </div>
      </ConfigCard>
    );
  }

  if (!operationsDraft || !latraDraft) {
    return (
      <ConfigCard title="Operations" description="Loading operations settings…">
        <ConfigSkeleton fields={ 6 } />
      </ConfigCard>
    );
  }

  return (
    <div className="space-y-5">
      <Tabs
        value={ activeTab }
        onValueChange={ (value) => {
          setActiveTab(value as OperationsTabId);
          setHistoryKey(null);
        } }
      >
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-auto bg-slate-100 p-1">
            <TabsTrigger
              value="operations"
              className="h-9 gap-2 px-3 text-slate-600 data-[state=active]:text-slate-900"
            >
              <Settings2 className="size-4" aria-hidden="true" />
              Operations
            </TabsTrigger>
            <TabsTrigger
              value="latra"
              className="h-9 gap-2 px-3 text-slate-600 data-[state=active]:text-slate-900"
            >
              <ShieldCheck className="size-4" aria-hidden="true" />
              LATRA compliance
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="operations">
          <div className="space-y-5">
            { operationsSections.length ? (
              operationsSections.map((section) => (
                <ConfigSection
                  key={ section.id }
                  section={ section }
                  records={ operationsRecords }
                  draft={ operationsDraft }
                  errors={ operationsForm.errors }
                  onChange={ handleOperationsChange }
                  onShowHistory={ setHistoryKey }
                />
              ))
            ) : (
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
                    Operational limits will appear here once they are available
                    in the config registry.
                  </p>
                </div>
              </ConfigCard>
            ) }

            <ConfigCard title="Not yet configurable">
              <div className="flex gap-3">
                <Info
                  className="mt-0.5 size-4 shrink-0 text-slate-400"
                  strokeWidth={ 1.8 }
                  aria-hidden="true"
                />
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">
                    These operational settings are planned but have no key in
                    the config registry yet, so they are read-only for now:
                  </p>
                  <ul className="grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
                    <li>Minimum driver payout</li>
                    <li>Automatic payout schedule</li>
                    <li>Document expiry reminder</li>
                    <li>Max concurrent ride requests</li>
                    <li>Ride request timeout</li>
                    <li>Admin session expiry</li>
                  </ul>
                </div>
              </div>
            </ConfigCard>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
              <TabActions
                dirty={ operationsForm.dirty }
                isSaving={ operationsForm.isSaving }
                onSave={ () =>
                  operationsForm.handleSave("Operations configuration saved.")
                }
                onReset={ operationsForm.reset }
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="latra">
          <div className="space-y-5">
            { latraSections.length ? (
              latraSections.map((section) => (
                <ConfigSection
                  key={ section.id }
                  section={ section }
                  records={ latraRecords }
                  draft={ latraDraft }
                  errors={ latraForm.errors }
                  onChange={ handleLatraChange }
                  onShowHistory={ setHistoryKey }
                />
              ))
            ) : (
              <ConfigCard
                title="LATRA compliance"
                description="No LATRA configuration was returned for this environment."
              >
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <ShieldCheck
                    className="size-6 text-slate-400"
                    strokeWidth={ 1.8 }
                    aria-hidden="true"
                  />
                  <p className="text-sm font-medium text-slate-700">
                    Nothing to configure yet
                  </p>
                  <p className="max-w-sm text-xs text-slate-500">
                    LATRA compliance settings will appear here once they are
                    available in the config registry.
                  </p>
                </div>
              </ConfigCard>
            ) }

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
              <TabActions
                dirty={ latraForm.dirty }
                isSaving={ latraForm.isSaving }
                onSave={ () =>
                  latraForm.handleSave("LATRA compliance configuration saved.")
                }
                onReset={ latraForm.reset }
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <ConfigHistoryPanel
        record={ historyRecord }
        open={ Boolean(historyKey) }
        onClose={ () => setHistoryKey(null) }
      />
    </div>
  );
}
