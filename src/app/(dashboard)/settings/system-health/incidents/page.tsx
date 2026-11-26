"use client";

import { Clock3 } from "lucide-react";

import { formatHealthSampleTime } from "@/components/systemHealth/healthBadges";
import { RecentIncidentsList } from "@/components/systemHealth/RecentIncidentsList";
import { HEALTH_SAMPLED_AT, MOCK_HEALTH_INCIDENTS } from "@/lib/systemHealth";

function RecentIncidentsPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Recent Incidents
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Illustrative service events and their current state.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
          <Clock3 className="size-3.5 text-slate-400" aria-hidden="true" />
          Sample snapshot · {formatHealthSampleTime(HEALTH_SAMPLED_AT)} EAT
        </span>
      </header>

      <RecentIncidentsList incidents={MOCK_HEALTH_INCIDENTS} />
    </div>
  );
}

export default RecentIncidentsPage;
