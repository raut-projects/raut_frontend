"use client";

import {
  DollarSign,
  Settings2,
  SlidersHorizontal,
  ToggleRight,
} from "lucide-react";

import {
  ConfigCard,
  ConfigSkeleton,
} from "@/components/platformConfig/ConfigPrimitives";
import { FeaturesTab } from "@/components/platformConfig/FeaturesTab";
import { OperationsTab } from "@/components/platformConfig/OperationsTab";
import { PricingTab } from "@/components/platformConfig/PricingTab";
import { QueryError } from "@/components/queryStates";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useConfigs } from "@/hooks/usePlatformConfig";

const TABS = [
  { value: "pricing", label: "Pricing", icon: DollarSign },
  { value: "features", label: "Features", icon: ToggleRight },
  { value: "operations", label: "Operations", icon: Settings2 },
];

export default function PlatformConfigPage() {
  const query = useConfigs();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-600">
          <SlidersHorizontal className="size-3.5" aria-hidden="true" />
          Settings
        </div>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Platform configuration
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-slate-500">
          Manage pricing, feature availability and operational limits. Each tab
          saves independently; use the history icon next to a setting to review
          its versions.
        </p>
      </header>

      { query.isPending ? (
        <ConfigCard
          title="Loading configuration"
          description="Fetching settings from the config registry…"
        >
          <ConfigSkeleton fields={ 8 } />
        </ConfigCard>
      ) : query.isError ? (
        <ConfigCard title="Configuration">
          <QueryError error={ query.error } onRetry={ query.refetch } />
        </ConfigCard>
      ) : (
        <Tabs defaultValue="pricing">
          <div className="overflow-x-auto pb-1">
            <TabsList className="h-auto bg-slate-100 p-1">
              { TABS.map((tab) => {
                const Icon = tab.icon;

                return (
                  <TabsTrigger
                    key={ tab.value }
                    value={ tab.value }
                    className="h-9 gap-2 px-3 text-slate-600 data-[state=active]:text-slate-900"
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    { tab.label }
                  </TabsTrigger>
                );
              }) }
            </TabsList>
          </div>

          <TabsContent value="pricing">
            <PricingTab configs={ query.data ?? [] } />
          </TabsContent>
          <TabsContent value="features">
            <FeaturesTab configs={ query.data ?? [] } />
          </TabsContent>
          <TabsContent value="operations">
            <OperationsTab configs={ query.data ?? [] } />
          </TabsContent>
        </Tabs>
      ) }
    </div>
  );
}
