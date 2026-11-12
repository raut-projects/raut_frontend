"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RideDispute } from "@/lib/rideDisputes";
import { formatMoneyTZS } from "@/lib/refundCalculator";

const labelClass = "mb-1 block text-xs font-semibold text-slate-600";

const decisionLabels: Record<string, string> = {
  rider: "Favor Customer",
  driver: "Favor Driver",
  split: "Split Responsibility",
};

interface DisputeSummaryProps {
  dispute: RideDispute;
  onBack: () => void;
}

export default function DisputeSummary({
  dispute,
  onBack,
}: DisputeSummaryProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 className="w-5 h-5 text-brand-600" />
        <h2 className="text-lg font-bold text-slate-900">Dispute resolved</h2>
      </div>

      <dl className="grid gap-3 sm:grid-cols-3 text-sm">
        <div className="col-span-full">
          <p className={labelClass}>Decision</p>
          <p className="font-medium text-slate-900">
            {decisionLabels[dispute.decision ?? "rider"]}
          </p>
        </div>
        <div>
          <p className={labelClass}>Refund amount</p>
          <p className="font-medium text-slate-900">
            {formatMoneyTZS(dispute.refundAmount ?? 0)}
          </p>
        </div>
        <div>
          <p className={labelClass}>Method</p>
          <p className="font-medium text-slate-900 capitalize">
            {dispute.refundMethod ?? "—"}
          </p>
        </div>
      </dl>

      {dispute.resolutionNote && (
        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className={labelClass}>Resolution note</p>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">
            {dispute.resolutionNote}
          </p>
        </div>
      )}

      <p className="mt-4 text-xs text-slate-500">
        Resolved {dispute.resolvedAt ?? "—"}
      </p>

      <div className="mt-6 flex justify-end">
        <Button type="button" onClick={onBack}>
          Back to rides
        </Button>
      </div>
    </section>
  );
}
