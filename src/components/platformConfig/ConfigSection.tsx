"use client";

import { History } from "lucide-react";

import {
  ConfigCard,
  ConfigField,
} from "@/components/platformConfig/ConfigPrimitives";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type {
  ConfigDraft,
  ConfigFieldSpec,
  ConfigFieldUnit,
  ConfigSectionSpec,
} from "@/lib/configRegistry";
import type { ConfigRecord, FieldErrors } from "@/types/platformConfig";

const fieldId = (key: string) =>
  `config-${key.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;

const UNIT_HINTS: Record<ConfigFieldUnit, string> = {
  money: "Amount in TZS.",
  percent: "Percentage value.",
  multiplier: "Multiplier, for example 1.5×.",
  ratio: "Ratio between 0 and 1.",
  minutes: "Duration in minutes.",
  seconds: "Duration in seconds.",
  meters: "Distance in metres.",
  km: "Distance in kilometres.",
  count: "Whole number.",
};

function HistoryButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={ onClick }
      aria-label={ `View history for ${label}` }
      title="View change history"
      className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      <History className="size-3.5" aria-hidden="true" />
    </button>
  );
}

function FieldControl({
  spec,
  draft,
  error,
  onChange,
  onShowHistory,
}: {
  spec: ConfigFieldSpec;
  draft: ConfigDraft;
  error?: string;
  onChange: (key: string, value: string) => void;
  onShowHistory: (key: string) => void;
}) {
  const id = fieldId(spec.key);
  const hint = spec.hint ?? (spec.unit ? UNIT_HINTS[spec.unit] : undefined);

  return (
    <ConfigField
      label={ spec.label }
      hint={ hint }
      error={ error }
      htmlFor={ id }
      action={
        <HistoryButton
          label={ spec.label }
          onClick={ () => onShowHistory(spec.key) }
        />
      }
    >
      { spec.type === "select" ? (
        <select
          id={ id }
          value={ String(draft[spec.key] ?? "") }
          onChange={ (event) => onChange(spec.key, event.target.value) }
          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-800 outline-none focus-visible:border-brand-400 focus-visible:ring-3 focus-visible:ring-brand-100"
        >
          { spec.options?.map((option) => (
            <option key={ option.value } value={ option.value }>
              { option.label }
            </option>
          )) }
        </select>
      ) : (
        <Input
          id={ id }
          type={ spec.type === "number" ? "number" : "text" }
          inputMode={ spec.type === "number" ? "decimal" : undefined }
          min={ spec.min }
          max={ spec.max }
          step={ spec.step ?? (spec.type === "number" ? "any" : undefined) }
          value={ String(draft[spec.key] ?? "") }
          placeholder={ spec.placeholder }
          aria-invalid={ error ? true : undefined }
          onChange={ (event) => onChange(spec.key, event.target.value) }
          className="h-10 border-slate-200 bg-white"
        />
      ) }
    </ConfigField>
  );
}

function SwitchControl({
  spec,
  draft,
  onChange,
  onShowHistory,
}: {
  spec: ConfigFieldSpec;
  draft: ConfigDraft;
  onChange: (key: string, value: boolean) => void;
  onShowHistory: (key: string) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-3 sm:col-span-2 lg:col-span-3">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-slate-800">{ spec.label }</p>
          <HistoryButton
            label={ spec.label }
            onClick={ () => onShowHistory(spec.key) }
          />
        </div>
        { spec.hint && (
          <p className="mt-0.5 text-xs text-slate-500">{ spec.hint }</p>
        ) }
      </div>
      <Switch
        checked={ Boolean(draft[spec.key]) }
        onCheckedChange={ (checked) => onChange(spec.key, checked) }
        aria-label={ spec.label }
      />
    </div>
  );
}

export function ConfigSection({
  section,
  records,
  draft,
  errors,
  onChange,
  onShowHistory,
}: {
  section: ConfigSectionSpec;
  records: ConfigRecord[];
  draft: ConfigDraft;
  errors: FieldErrors;
  onChange: (key: string, value: string | boolean) => void;
  onShowHistory: (key: string) => void;
}) {
  const recordByKey = new Map(records.map((record) => [record.key, record]));

  return (
    <ConfigCard title={ section.title } description={ section.description }>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        { section.fields.map((spec) => {
          if (!recordByKey.has(spec.key)) return null;

          if (spec.type === "switch") {
            return (
              <SwitchControl
                key={ spec.key }
                spec={ spec }
                draft={ draft }
                onChange={ onChange }
                onShowHistory={ onShowHistory }
              />
            );
          }

          return (
            <FieldControl
              key={ spec.key }
              spec={ spec }
              draft={ draft }
              error={ errors[spec.key] }
              onChange={ onChange }
              onShowHistory={ onShowHistory }
            />
          );
        }) }
      </div>
    </ConfigCard>
  );
}
