"use client";

import {
  Pencil,
  Power,
  PowerOff,
  Send,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const actionButtonClass =
  "h-8 border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:text-slate-400 disabled:opacity-100";

export function ReferralBulkActions({
  selectedCount,
  activateCount,
  deactivateCount,
  deleteCount,
  pending,
  onActivate,
  onDeactivate,
  onEdit,
  onSend,
  onDelete,
  onClear,
}: {
  selectedCount: number;
  activateCount: number;
  deactivateCount: number;
  deleteCount: number;
  pending: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  onEdit: () => void;
  onSend: () => void;
  onDelete: () => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-100 bg-brand-50/70 px-4 py-2.5 sm:px-5">
      <p className="text-xs font-medium text-brand-800">
        <span className="font-semibold">{selectedCount}</span> selected
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending || activateCount === 0}
          onClick={onActivate}
          className={actionButtonClass}
        >
          <Power className="size-3.5" aria-hidden="true" />
          Activate{activateCount > 0 ? ` (${activateCount})` : ""}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending || deactivateCount === 0}
          onClick={onDeactivate}
          className={actionButtonClass}
        >
          <PowerOff className="size-3.5" aria-hidden="true" />
          Deactivate{deactivateCount > 0 ? ` (${deactivateCount})` : ""}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending || selectedCount === 0}
          onClick={onEdit}
          className={actionButtonClass}
        >
          <Pencil className="size-3.5" aria-hidden="true" />
          Edit
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending || selectedCount === 0}
          onClick={onSend}
          className={actionButtonClass}
        >
          <Send className="size-3.5" aria-hidden="true" />
          Send
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending || deleteCount === 0}
          onClick={onDelete}
          className="h-8 border-rose-200 bg-white px-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:text-rose-300 disabled:opacity-100"
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
          Delete{deleteCount > 0 ? ` (${deleteCount})` : ""}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={onClear}
          className="h-8 px-2.5 text-xs font-semibold text-slate-500 hover:bg-white hover:text-slate-700"
        >
          <X className="size-3.5" aria-hidden="true" />
          Clear
        </Button>
      </div>
    </div>
  );
}
