"use client";

import { useState } from "react";
import { Flag, CreditCard, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import SidePanel from "@/components/SidePanel";

type FlagIssueDialogProps = {
  open: boolean;
  onClose: () => void;
  pending: boolean;
  onConfirm: (reason: string, severity: "low" | "medium" | "high") => void;
};

export function FlagIssueDialog({
  open,
  onClose,
  pending,
  onConfirm,
}: FlagIssueDialogProps) {
  const [reason, setReason] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high">("medium");
  return (
    <SidePanel
      open={ open }
      onClose={ onClose }
      title="Flag issue"
      description="Mark this ride for review and add it to the issues queue."
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" onClick={ onClose } disabled={ pending }>
            Back
          </Button>
          <Button disabled={ pending || !reason.trim() } onClick={ () => onConfirm(reason, severity) }>
            { pending ? "Flagging…" : "Flag issue" }
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-2">
          <Flag className="w-4 h-4 text-amber-500 mt-0.5" />
          <p className="text-sm text-slate-700">
            Flagging adds this ride to the issues queue and pulses it on the map.
          </p>
        </div>
        <Separator />
        <div>
          <p className="text-xs font-semibold text-slate-900 mb-2">Reason</p>
          <textarea
            value={ reason }
            onChange={ (e) => setReason(e.target.value) }
            rows={ 3 }
            placeholder="Describe the issue…"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-900 mb-2">Severity</p>
          <div className="flex gap-2">
            { ["low", "medium", "high"].map((s) => (
              <button
                key={ s }
                onClick={ () => setSeverity(s as any) }
                className={ `rounded-lg border px-3 py-1.5 text-xs transition-colors ${severity === s
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }` }
              >
                { s.charAt(0).toUpperCase() + s.slice(1) }
              </button>
            )) }
          </div>
        </div>
      </div>
    </SidePanel>
  );
}

type OverrideFareDialogProps = {
  open: boolean;
  onClose: () => void;
  pending: boolean;
  currentFare: number;
  onConfirm: (amount: number, reason: string) => void;
};

export function OverrideFareDialog({
  open,
  onClose,
  pending,
  currentFare,
  onConfirm,
}: OverrideFareDialogProps) {
  const [amount, setAmount] = useState(currentFare);
  const [reason, setReason] = useState("");
  return (
    <SidePanel
      open={ open }
      onClose={ onClose }
      title="Override fare"
      description="Manually set the final fare. Requires a reason and is logged in the audit trail."
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" onClick={ onClose } disabled={ pending }>
            Back
          </Button>
          <Button disabled={ pending || !reason.trim() } onClick={ () => onConfirm(Number(amount) || 0, reason) }>
            { pending ? "Updating…" : "Override fare" }
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-2">
          <CreditCard className="w-4 h-4 text-amber-500 mt-0.5" />
          <p className="text-sm text-slate-700">
            The new fare is charged to the customer and reconciled with the driver payout.
          </p>
        </div>
        <Separator />
        <div>
          <p className="text-xs font-semibold text-slate-900 mb-2">New fare (TZS)</p>
          <input
            type="number"
            min={ 0 }
            value={ String(amount) }
            onChange={ (e) => setAmount(Number(e.target.value) || 0) }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <p className="mt-1 text-xs text-slate-500">Current: { currentFare.toLocaleString() } TZS</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-900 mb-2">Reason (required)</p>
          <textarea
            value={ reason }
            onChange={ (e) => setReason(e.target.value) }
            rows={ 3 }
            placeholder="Why is the fare being adjusted…"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>
    </SidePanel>
  );
}

type EscalateDialogProps = {
  open: boolean;
  onClose: () => void;
  pending: boolean;
  onConfirm: (note: string) => void;
};

export function EscalateDialog({
  open,
  onClose,
  pending,
  onConfirm,
}: EscalateDialogProps) {
  const [note, setNote] = useState("");
  return (
    <SidePanel
      open={ open }
      onClose={ onClose }
      title="Escalate ride"
      description="Send this ride to a Platform Manager for review."
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" onClick={ onClose } disabled={ pending }>
            Back
          </Button>
          <Button disabled={ pending || !note.trim() } onClick={ () => onConfirm(note) }>
            { pending ? "Escalating…" : "Escalate" }
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5" />
          <p className="text-sm text-slate-700">
            A notification is sent to the Platform Manager with the ride ID and your note.
          </p>
        </div>
        <Separator />
        <div>
          <p className="text-xs font-semibold text-slate-900 mb-2">Note</p>
          <textarea
            value={ note }
            onChange={ (e) => setNote(e.target.value) }
            rows={ 3 }
            placeholder="Optional note for the Platform Manager…"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>
    </SidePanel>
  );
}

type AddNoteDialogProps = {
  open: boolean;
  onClose: () => void;
  pending: boolean;
  onConfirm: (text: string) => void;
};

export function AddNoteDialog({
  open,
  onClose,
  pending,
  onConfirm,
}: AddNoteDialogProps) {
  const [text, setText] = useState("");
  return (
    <SidePanel
      open={ open }
      onClose={ onClose }
      title="Add note"
      description="Add an internal note visible to admins only."
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" onClick={ onClose } disabled={ pending }>
            Back
          </Button>
          <Button disabled={ pending || !text.trim() } onClick={ () => onConfirm(text) }>
            { pending ? "Saving…" : "Add note" }
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-slate-900 mb-2">Note</p>
          <textarea
            value={ text }
            onChange={ (e) => setText(e.target.value) }
            rows={ 4 }
            placeholder="Internal note…"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>
    </SidePanel>
  );
}
