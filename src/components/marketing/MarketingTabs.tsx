"use client";

import { PROMOTION_TABS, type PromotionTab } from "@/lib/marketing";

export function MarketingTabs({
  value,
  onChange,
}: {
  value: PromotionTab;
  onChange: (tab: PromotionTab) => void;
}) {
  return (
    <div
      className="flex gap-1 overflow-x-auto border-b border-slate-200"
      aria-label="Filter promotions by status"
    >
      {PROMOTION_TABS.map((tab) => {
        const active = value === tab.value;

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            aria-pressed={active}
            className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
              active
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
