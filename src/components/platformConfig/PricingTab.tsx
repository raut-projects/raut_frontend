"use client";

import { useMemo, useState } from "react";
import { DollarSign } from "lucide-react";

import { ConfigHistoryPanel } from "@/components/platformConfig/ConfigHistoryPanel";
import { ConfigSection } from "@/components/platformConfig/ConfigSection";
import {
  ConfigCard,
  ConfigSkeleton,
  TabActions,
} from "@/components/platformConfig/ConfigPrimitives";
import {
  FareCalculator,
  type FareVehicle,
} from "@/components/platformConfig/FareCalculator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useConfigForm } from "@/hooks/useConfigForm";
import {
  PRICING_TABS,
  isPricingConfig,
  pricingTabForKey,
  sectionsForRecords,
  type PricingTabId,
} from "@/lib/configRegistry";
import type { ConfigRecord } from "@/types/platformConfig";

export function PricingTab({ configs }: { configs: ConfigRecord[] }) {
  const records = useMemo(() => configs.filter(isPricingConfig), [configs]);
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

  const [activeTab, setActiveTab] = useState<PricingTabId>("duo");
  const [historyKey, setHistoryKey] = useState<string | null>(null);

  const recordsByTab = useMemo(() => {
    const grouped: Record<PricingTabId, ConfigRecord[]> = {
      duo: [],
      private: [],
      public: [],
    };

    for (const record of records) {
      const tab = pricingTabForKey(record.key);
      if (tab) grouped[tab].push(record);
    }

    return grouped;
  }, [records]);

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
        title="Pricing"
        description="No pricing configuration was returned for this environment."
      >
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <DollarSign
            className="size-6 text-slate-400"
            strokeWidth={ 1.8 }
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-slate-700">
            Nothing to configure yet
          </p>
          <p className="max-w-sm text-xs text-slate-500">
            Pricing keys will appear here once they are available in the config
            registry.
          </p>
        </div>
      </ConfigCard>
    );
  }

  if (!draft) {
    return (
      <ConfigCard title="Pricing" description="Loading pricing settings…">
        <ConfigSkeleton fields={ 6 } />
      </ConfigCard>
    );
  }

  const surgeMultiplier = Number(draft["surge.peak_hours_multiplier"]);
  const surgePercent =
    Number.isFinite(surgeMultiplier) && surgeMultiplier > 1
      ? String(Number(((surgeMultiplier - 1) * 100).toFixed(2)))
      : "0";

  const vehicle = (
    label: string,
    baseKey: string,
    rateKey: string,
  ): FareVehicle => ({
    label,
    baseFare: String(draft[baseKey] ?? ""),
    pricePerKm: String(draft[rateKey] ?? ""),
  });

  return (
    <>
      <Tabs
        value={ activeTab }
        onValueChange={ (value) => setActiveTab(value as PricingTabId) }
      >
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-auto bg-slate-100 p-1">
            { PRICING_TABS.map((tab) => (
              <TabsTrigger
                key={ tab.id }
                value={ tab.id }
                className="h-9 px-3 text-slate-600 data-[state=active]:text-slate-900"
              >
                { tab.label }
              </TabsTrigger>
            )) }
          </TabsList>
        </div>

        { PRICING_TABS.map((tab) => {
          const tabRecords = recordsByTab[tab.id];
          const sections = sectionsForRecords(tab.sections, tabRecords);

          return (
            <TabsContent key={ tab.id } value={ tab.id }>
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]">
                <div className="space-y-5">
                  { sections.length ? (
                    sections.map((section) => (
                      <ConfigSection
                        key={ section.id }
                        section={ section }
                        records={ tabRecords }
                        draft={ draft }
                        errors={ errors }
                        onChange={ handleChange }
                        onShowHistory={ setHistoryKey }
                      />
                    ))
                  ) : (
                    <ConfigCard title={ tab.label } description={ tab.description }>
                      <p className="py-6 text-center text-sm text-slate-500">
                        No settings in this tab yet.
                      </p>
                    </ConfigCard>
                  ) }
                </div>

                { tab.id === "private" && (
                  <FareCalculator
                    surgePercent={ surgePercent }
                    vehicles={ [
                      vehicle(
                        "Car",
                        "pricing.base_fare.car",
                        "pricing.per_km_rate.car",
                      ),
                      vehicle(
                        "XL",
                        "pricing.base_fare.xl",
                        "pricing.per_km_rate.xl",
                      ),
                    ] }
                  />
                ) }

                { tab.id === "public" && (
                  <FareCalculator
                    surgePercent={ surgePercent }
                    vehicles={ [
                      vehicle(
                        "Boda",
                        "pricing.base_fare.boda",
                        "pricing.per_km_rate.boda",
                      ),
                      vehicle(
                        "Bajaji",
                        "pricing.base_fare.bajaji",
                        "pricing.per_km_rate.bajaji",
                      ),
                    ] }
                  />
                ) }
              </div>
            </TabsContent>
          );
        }) }
      </Tabs>

      <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        <TabActions
          dirty={ dirty }
          isSaving={ isSaving }
          onSave={ () => handleSave("Pricing configuration saved.") }
          onReset={ reset }
        />
      </div>

      <ConfigHistoryPanel
        record={ historyRecord }
        open={ Boolean(historyKey) }
        onClose={ () => setHistoryKey(null) }
      />
    </>
  );
}
