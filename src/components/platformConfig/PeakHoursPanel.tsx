"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import SidePanel from "@/components/SidePanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { createPeakHourSlot, DAY_LABELS, sortPeakHourSlots } from "@/lib/platformConfig";
import {
  PEAK_HOUR_DAYS,
  type PeakHourSlotDraft,
} from "@/types/platformConfig";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function PeakHoursPanel({
  open,
  onClose,
  slots,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  slots: PeakHourSlotDraft[];
  onChange: (slots: PeakHourSlotDraft[]) => void;
}) {
  const [draft, setDraft] = useState<PeakHourSlotDraft[]>(() =>
    sortPeakHourSlots(slots),
  );
  const [error, setError] = useState("");

  const updateSlot = (id: string, update: Partial<PeakHourSlotDraft>) => {
    setDraft((current) =>
      current.map((slot) => (slot.id === id ? { ...slot, ...update } : slot)),
    );
  };

  const addSlot = () => {
    setDraft((current) => [...current, createPeakHourSlot("monday")]);
  };

  const removeSlot = (id: string) => {
    setDraft((current) => current.filter((slot) => slot.id !== id));
  };

  const apply = () => {
    const invalid = draft.find(
      (slot) =>
        slot.enabled &&
        (!TIME_PATTERN.test(slot.start) ||
          !TIME_PATTERN.test(slot.end) ||
          slot.start >= slot.end),
    );

    if (invalid) {
      setError(
        `${DAY_LABELS[invalid.day]} needs a valid end time after its start time.`,
      );
      return;
    }

    onChange(sortPeakHourSlots(draft));
    onClose();
  };

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title="Peak hours"
      description="Set the windows that receive the peak-hour surge."
      wide
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-9 border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={apply}
            className="h-9 bg-brand-600 px-3.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Apply hours
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          Each enabled window is used to decide whether a trip is charged the
          peak-hour surge. Turn a day off to exclude it without deleting the
          window.
        </p>

        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
            {error}
          </p>
        )}

        <div className="space-y-3">
          {draft.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center">
              <p className="text-sm font-medium text-slate-700">
                No peak-hour windows
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Trips are charged the base fare without a surge.
              </p>
            </div>
          )}

          {draft.map((slot) => (
            <div
              key={slot.id}
              className="rounded-lg border border-slate-200 bg-white p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <select
                  value={slot.day}
                  onChange={(event) =>
                    updateSlot(slot.id, {
                      day: event.target.value as PeakHourSlotDraft["day"],
                    })
                  }
                  className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  aria-label="Peak hour day"
                >
                  {PEAK_HOUR_DAYS.map((day) => (
                    <option key={day} value={day}>
                      {DAY_LABELS[day]}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={slot.enabled}
                    onCheckedChange={(checked) =>
                      updateSlot(slot.id, { enabled: checked })
                    }
                    aria-label={`Enable ${DAY_LABELS[slot.day]} peak hours`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeSlot(slot.id)}
                    className="text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Remove ${DAY_LABELS[slot.day]} peak hours`}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="text-xs font-medium text-slate-500">
                  Start
                  <Input
                    type="time"
                    value={slot.start}
                    onChange={(event) =>
                      updateSlot(slot.id, { start: event.target.value })
                    }
                    className="mt-1 h-9 border-slate-200 bg-white text-sm"
                  />
                </label>
                <label className="text-xs font-medium text-slate-500">
                  End
                  <Input
                    type="time"
                    value={slot.end}
                    onChange={(event) =>
                      updateSlot(slot.id, { end: event.target.value })
                    }
                    className="mt-1 h-9 border-slate-200 bg-white text-sm"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={addSlot}
          className="h-9 w-full border-dashed border-slate-300 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          <Plus />
          Add peak-hour window
        </Button>
      </div>
    </SidePanel>
  );
}
