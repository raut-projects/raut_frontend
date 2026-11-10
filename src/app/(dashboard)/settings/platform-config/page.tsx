"use client";

import {
  Cable,
  DollarSign,
  Settings2,
  SlidersHorizontal,
  ToggleRight,
} from "lucide-react";

import { ChangeHistory } from "@/components/platformConfig/ChangeHistory";
import { FeaturesTab } from "@/components/platformConfig/FeaturesTab";
import { IntegrationsTab } from "@/components/platformConfig/IntegrationsTab";
import { OperationsTab } from "@/components/platformConfig/OperationsTab";
import { PricingTab } from "@/components/platformConfig/PricingTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = [
  { value: "pricing", label: "Pricing", icon: DollarSign },
  { value: "features", label: "Features", icon: ToggleRight },
  { value: "operations", label: "Operations", icon: Settings2 },
  { value: "integrations", label: "Integrations", icon: Cable },
];

export default function PlatformConfigPage() {
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
          Manage pricing, feature availability, operational limits and
          integrations. Each tab saves independently and every change is
          recorded below.
        </p>
      </header>

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
          <PricingTab />
        </TabsContent>
        <TabsContent value="features">
          <FeaturesTab />
        </TabsContent>
        <TabsContent value="operations">
          <OperationsTab />
        </TabsContent>
        <TabsContent value="integrations">
          <IntegrationsTab />
        </TabsContent>
      </Tabs>

      <ChangeHistory />
    </div>
  );
}
