"use client";

import { useState } from "react";

import { ReferralCodeDirectory } from "@/components/marketing/ReferralCodeDirectory";
import { ReferralProgramsDashboard } from "@/components/marketing/ReferralProgramsDashboard";
import { Button } from "@/components/ui/button";

export default function ReferralsPage() {
  const [view, setView] = useState<"programs" | "codes">("programs");
  const viewSwitcher = (
    <div
      role="group"
      aria-label="Referral management view"
      className="flex shrink-0 rounded-lg border border-slate-200 bg-white p-1"
    >
      <Button
        type="button"
        size="sm"
        variant={view === "programs" ? "default" : "ghost"}
        aria-pressed={view === "programs"}
        onClick={() => setView("programs")}
      >
        Programs & activity
      </Button>
      <Button
        type="button"
        size="sm"
        variant={view === "codes" ? "default" : "ghost"}
        aria-pressed={view === "codes"}
        onClick={() => setView("codes")}
      >
        Referral codes
      </Button>
    </div>
  );

  if (view === "programs") {
    return <ReferralProgramsDashboard viewSwitcher={viewSwitcher} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">{viewSwitcher}</div>
      <ReferralCodeDirectory />
    </div>
  );
}
