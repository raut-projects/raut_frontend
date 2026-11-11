"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DisputeDecision, RideDispute } from "@/lib/rideDisputes";
import {
  RefundMethod,
  suggestRefund,
  REFUND_METHODS,
  formatMoneyTZS,
} from "@/lib/refundCalculator";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";

const labelClass = "mb-1 block text-xs font-semibold text-slate-600";
const errorClass = "mt-1 block text-xs font-medium text-rose-600";

const decisionOptions: { value: DisputeDecision; label: string }[] = [
  { value: "rider", label: "Favor Rider" },
  { value: "driver", label: "Favor Driver" },
  { value: "split", label: "Split Responsibility" },
];

interface ResolveDisputeFormProps {
  dispute: RideDispute;
  onResolve: (input: {
    decision: DisputeDecision;
    refundAmount: number;
    refundMethod: RefundMethod;
    resolutionNote: string;
  }) => Promise<void>;
  isPending: boolean;
}

export default function ResolveDisputeForm({
  dispute,
  onResolve,
  isPending,
}: ResolveDisputeFormProps) {
  const { evidence } = dispute;
  const maxRefund = evidence.originalFare;
  const suggested = dispute.suggestedRefund ?? suggestRefund({
    issueType: dispute.complaint,
    originalFare: evidence.originalFare,
    actualDistanceKm: evidence.actualDistanceKm,
    extraDistanceKm: evidence.extraDistanceKm,
  });

  const [decision, setDecision] = useState<DisputeDecision>(
    dispute.decision ?? "rider",
  );
  const [refundAmount, setRefundAmount] = useState<number>(
    dispute.refundAmount ?? (decision === "driver" ? 0 : suggested),
  );
  const [refundMethod, setRefundMethod] = useState<RefundMethod>(
    dispute.refundMethod ?? "mpesa",
  );
  const [resolutionNote, setResolutionNote] = useState<string>(
    dispute.resolutionNote ?? "",
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isFavorDriver = decision === "driver";
  const effectiveAmount = isFavorDriver ? 0 : refundAmount;

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (resolutionNote.trim().length < 5) {
      next.note = "Please add a resolution note (5+ characters).";
    }

    if (effectiveAmount < 0 || effectiveAmount > maxRefund) {
      next.amount = `Refund must be between 0 and ${formatMoneyTZS(maxRefund)}.`;
    }

    if (isFavorDriver && effectiveAmount !== 0) {
      next.amount = "Favoring the driver means no refund is due.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleDecision = (value: DisputeDecision) => {
    setDecision(value);
    if (value === "driver") {
      setRefundAmount(0);
    } else if (refundAmount === 0) {
      setRefundAmount(suggested);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    await onResolve({
      decision,
      refundAmount: effectiveAmount,
      refundMethod,
      resolutionNote: resolutionNote.trim(),
    });
  };

  if (dispute.status === "resolved") return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="col-span-full">
          <p className={labelClass}>{dispute.complaintLabel}</p>
          <p className="text-sm text-slate-500">
            Filed {dispute.filedAt} · by {dispute.disputingParty}
          </p>
        </div>

        <div className="col-span-full">
          <label className={labelClass}>Disputed fare</label>
          <p className="text-lg font-semibold text-slate-900">
            {formatMoneyTZS(evidence.originalFare)}
          </p>
        </div>

        <div>
          <label className={labelClass}>Actual route distance</label>
          <p className="text-sm text-slate-700">
            {evidence.actualDistanceKm.toFixed(1)} km
          </p>
        </div>

        <div>
          <label className={labelClass}>Optimal route distance</label>
          <p className="text-sm text-slate-700">
            {evidence.optimalDistanceKm.toFixed(1)} km
          </p>
        </div>

        <div>
          <label className={labelClass}>Extra distance</label>
          <p className="text-sm text-slate-700">
            {evidence.extraDistanceKm.toFixed(1)} km
          </p>
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Decision
        </h3>
        <div className="grid gap-2 sm:grid-cols-3">
          {decisionOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={decision === option.value}
              onClick={() => handleDecision(option.value)}
              className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                decision === option.value
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Refund amount</label>
          <input
            type="number"
            min="0"
            max={maxRefund}
            step="100"
            value={effectiveAmount}
            disabled={isFavorDriver || isPending}
            onChange={(event) => setRefundAmount(Number(event.target.value))}
            className={inputClass}
          />
          {errors.amount && <p className={errorClass}>{errors.amount}</p>}
          <p className="text-xs text-slate-500">
            Suggested: {formatMoneyTZS(suggested)} · Max:{" "}
            {formatMoneyTZS(maxRefund)}
          </p>
        </div>

        <div>
          <label className={labelClass}>Refund method</label>
          <select
            value={refundMethod}
            disabled={isFavorDriver || isPending}
            onChange={(event) =>
              setRefundMethod(event.target.value as RefundMethod)
            }
            className={inputClass}
          >
            {REFUND_METHODS.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Resolution note</label>
        <textarea
          value={resolutionNote}
          onChange={(event) => setResolutionNote(event.target.value)}
          rows={3}
          maxLength={1000}
          disabled={isPending}
          placeholder="Why was this decision made?…"
          className={inputClass + " resize-y"}
        />
        {errors.note && <p className={errorClass}>{errors.note}</p>}
        <p className="text-xs text-slate-500">
          {resolutionNote.trim().length}/1000 characters
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
        <Button type="button" variant="outline" asChild disabled={isPending}>
          <Link href="/rides">Back to rides</Link>
        </Button>
        <Button type="submit" disabled={isPending || Object.keys(errors).length > 0}>
          {isPending ? "Resolving…" : "Resolve dispute"}
        </Button>
      </div>
    </form>
  );
}
