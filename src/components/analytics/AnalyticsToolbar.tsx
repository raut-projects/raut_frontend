"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  RANGE_PRESETS,
  addDays,
  diffDays,
  formatRangeLabel,
  getCustomRange,
  getPresetRange,
  toDateInput,
  todayInput,
} from "../../lib/dateRange";
import type { AnalyticsPreset, AnalyticsRange } from "../../types/index";

interface AnalyticsToolbarProps {
  range: AnalyticsRange;
  compare: boolean;
  comparisonReason?: string | null;
  disabled?: boolean;
  onRangeChange: (range: AnalyticsRange) => void;
  onCompareChange: (value: boolean) => void;
  onExportCsv: () => void;
  onExportPdf: () => void;
}

const RANGE_OPTIONS: Array<{ value: AnalyticsPreset; label: string }> =
  RANGE_PRESETS.map(({ value, label }) => ({ value, label }));

export function AnalyticsToolbar({
  range,
  compare,
  comparisonReason,
  disabled = false,
  onRangeChange,
  onCompareChange,
  onExportCsv,
  onExportPdf,
}: AnalyticsToolbarProps) {
  const [customOpen, setCustomOpen] = useState(range.preset === "custom");
  const [customStart, setCustomStart] = useState(range.startStr);
  const [customEnd, setCustomEnd] = useState(range.endStr);
  const [customError, setCustomError] = useState("");

  const maxDate = todayInput();

  const handlePresetClick = (preset: AnalyticsPreset) => {
    setCustomError("");

    if (preset === "custom") {
      if (range.preset !== "custom") {
        const span = diffDays(range.start, range.end) + 1;
        const nextStart = toDateInput(addDays(range.end, -(span - 1)));
        setCustomStart(nextStart);
        setCustomEnd(range.endStr);
        const next = getCustomRange(nextStart, range.endStr);
        if (next) onRangeChange(next);
      }
      setCustomOpen(true);
      return;
    }

    setCustomOpen(false);
    onRangeChange(getPresetRange(preset));
  };

  const applyCustomRange = () => {
    const next = getCustomRange(customStart, customEnd);
    if (!next) {
      setCustomError(
        "Choose a valid range of up to 365 days ending today or earlier.",
      );
      return;
    }
    setCustomError("");
    onRangeChange(next);
  };

  return (
    <div className="flex flex-col items-stretch gap-2 print:hidden sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          type="single"
          size="sm"
          spacing={2}
          value={range.preset}
          onValueChange={(value) => {
            if (value) handlePresetClick(value as AnalyticsPreset);
          }}
          aria-label="Analytics range"
          className="gap-0 rounded-lg border border-slate-200 bg-white p-0.5 shadow-card"
        >
          {RANGE_OPTIONS.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              className="h-auto rounded-md px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700 data-[state=on]:bg-brand-600! data-[state=on]:text-white!"
            >
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div
          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
            compare
              ? "border-brand-200 bg-brand-50 text-brand-700"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Switch
            id="analytics-compare"
            checked={compare}
            onCheckedChange={onCompareChange}
            size="sm"
            className="data-unchecked:bg-slate-300"
          />
          <Label
            htmlFor="analytics-compare"
            className="cursor-pointer text-xs font-semibold"
          >
            Compare
          </Label>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className="h-auto rounded-lg border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-card hover:bg-slate-50 disabled:opacity-50"
            >
              Export
              <ChevronDown
                className="h-3.5 w-3.5"
                strokeWidth={2}
                aria-hidden="true"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-52 rounded-xl border border-slate-200 bg-white p-0 py-1 shadow-elevated ring-0"
          >
            <DropdownMenuItem
              onSelect={onExportCsv}
              className="rounded-none px-3 py-2 text-xs font-medium text-slate-600 focus:bg-slate-50 focus:text-slate-600"
            >
              Download CSV
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={onExportPdf}
              className="rounded-none px-3 py-2 text-xs font-medium text-slate-600 focus:bg-slate-50 focus:text-slate-600"
            >
              Print / Save as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Badge
          variant="secondary"
          className="rounded-full px-2 py-0.5 text-xs font-medium text-slate-600"
        >
          {formatRangeLabel(range)}
        </Badge>
        <span className="font-medium capitalize">{range.granularity}</span>
      </div>

      {customOpen && (
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-card">
          <Label className="flex flex-col items-start gap-0 text-[11px] font-medium text-slate-500">
            Start
            <Input
              type="date"
              value={customStart}
              max={customEnd || maxDate}
              onChange={(event) => setCustomStart(event.target.value)}
              className="mt-1 block h-auto w-auto rounded-lg border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus-visible:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-100"
            />
          </Label>
          <Label className="flex flex-col items-start gap-0 text-[11px] font-medium text-slate-500">
            End
            <Input
              type="date"
              value={customEnd}
              min={customStart}
              max={maxDate}
              onChange={(event) => setCustomEnd(event.target.value)}
              className="mt-1 block h-auto w-auto rounded-lg border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus-visible:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-100"
            />
          </Label>
          <Button
            type="button"
            onClick={applyCustomRange}
            className="h-auto rounded-lg px-3 py-1.5 text-xs font-semibold focus-visible:ring-brand-600"
          >
            Apply
          </Button>
          {customError && (
            <p className="w-full text-xs text-rose-600">{customError}</p>
          )}
        </div>
      )}

      {compare && comparisonReason && (
        <p className="text-xs text-amber-600">{comparisonReason}</p>
      )}
    </div>
  );
}
