"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Can } from "@/components/Can";
import { Button } from "@/components/ui/button";
import SidePanel from "@/components/SidePanel";
import { useToast } from "@/components/toastContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useUpdateConfigs } from "@/hooks/usePlatformConfig";
import {
  PEAK_DAYS,
  parsePeakHours,
  serializePeakHours,
  type PeakHoursSchedule,
} from "@/lib/platformConfig";
import { PERMISSIONS } from "@/lib/permissions";
import type { ConfigValue } from "@/types/platformConfig";

export const PEAK_HOURS_KEY = "surge.peak_hours";

export function PeakHoursDialog({
  onClose,
  value,
}: {
  onClose: () => void;
  value: ConfigValue | undefined;
}) {
  const update = useUpdateConfigs();
  const { success, error: toastError } = useToast();
  const { has } = usePermissions();
  const canManage = has(PERMISSIONS.PLATFORM_CONFIG_MANAGE);
  const [schedule, setSchedule] = useState<PeakHoursSchedule>(() =>
    parsePeakHours(value),
  );

  const setDaySlots = (
    dayId: string,
    updater: (slots: { start: string; end: string }[]) => {
      start: string;
      end: string;
    }[],
  ) => {
    setSchedule((current) => ({
      ...current,
      [dayId]: updater(current[dayId] ?? []),
    }));
  };

  const addSlot = (dayId: string) =>
    setDaySlots(dayId, (slots) => [...slots, { start: "17:00", end: "19:00" }]);

  const removeSlot = (dayId: string, index: number) =>
    setDaySlots(dayId, (slots) => slots.filter((_, i) => i !== index));

  const updateSlot = (
    dayId: string,
    index: number,
    field: "start" | "end",
    next: string,
  ) =>
    setDaySlots(dayId, (slots) =>
      slots.map((slot, i) => (i === index ? { ...slot, [field]: next } : slot)),
    );

  const handleSave = async () => {
    const payload = serializePeakHours(schedule);

    try {
      const failures = await update.mutateAsync([
        { key: PEAK_HOURS_KEY, value: { ...payload } },
      ]);

      if (failures.length) {
        toastError(failures[0].error, "Could not save peak hours.");
        return;
      }

      success("Peak hours saved.");
      onClose();
    } catch (saveError) {
      toastError(saveError, "Could not save peak hours.");
    }
  };

  return (
    <SidePanel
      open
      onClose={ onClose }
      title="Edit peak hours"
      description="Windows when the peak-hour surge multiplier applies."
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={ onClose }
            disabled={ update.isPending }
            className="h-9 border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Can permission={ PERMISSIONS.PLATFORM_CONFIG_MANAGE }>
            <Button
              type="button"
              onClick={ handleSave }
              disabled={ update.isPending }
              className="h-9 bg-brand-600 px-3.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              { update.isPending ? "Saving..." : "Save peak hours" }
            </Button>
          </Can>
        </>
      }
    >
      <div className="space-y-3">
        { PEAK_DAYS.map((day) => {
          const slots = schedule[day.id] ?? [];

          return (
            <div
              key={ day.id }
              className="rounded-lg border border-slate-200 bg-white px-3 py-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">
                  { day.label }
                </p>
                <button
                  type="button"
                  onClick={ () => addSlot(day.id) }
                  disabled={ !canManage }
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  Add window
                </button>
              </div>

              { slots.length ? (
                <div className="mt-2 space-y-2">
                  { slots.map((slot, index) => (
                    <div
                      key={ index }
                      className="flex items-center gap-2"
                    >
                      <input
                        type="time"
                        value={ slot.start }
                        disabled={ !canManage }
                        onChange={ (event) =>
                          updateSlot(day.id, index, "start", event.target.value)
                        }
                        aria-label={ `${day.label} window ${index + 1} start` }
                        className="h-9 flex-1 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-800 outline-none focus-visible:border-brand-400 focus-visible:ring-3 focus-visible:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                      />
                      <span className="text-xs text-slate-400">to</span>
                      <input
                        type="time"
                        value={ slot.end }
                        disabled={ !canManage }
                        onChange={ (event) =>
                          updateSlot(day.id, index, "end", event.target.value)
                        }
                        aria-label={ `${day.label} window ${index + 1} end` }
                        className="h-9 flex-1 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-800 outline-none focus-visible:border-brand-400 focus-visible:ring-3 focus-visible:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                      />
                      <button
                        type="button"
                        onClick={ () => removeSlot(day.id, index) }
                        disabled={ !canManage }
                        aria-label={ `Remove ${day.label} window ${index + 1}` }
                        className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  )) }
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-400">No peak windows.</p>
              ) }
            </div>
          );
        }) }
      </div>
    </SidePanel>
  );
}
