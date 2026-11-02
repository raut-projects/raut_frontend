'use client'

import { useState } from 'react'
import {
  RANGE_PRESETS,
  addDays,
  diffDays,
  formatRangeLabel,
  getCustomRange,
  getPresetRange,
  toDateInput,
  todayInput,
} from '../../lib/dateRange'
import type { AnalyticsPreset, AnalyticsRange } from '../../types/index'

interface AnalyticsToolbarProps {
  range: AnalyticsRange
  compare: boolean
  comparisonReason?: string | null
  disabled?: boolean
  onRangeChange: (range: AnalyticsRange) => void
  onCompareChange: (value: boolean) => void
  onExportCsv: () => void
  onExportPdf: () => void
}

const RANGE_OPTIONS: Array<{ value: AnalyticsPreset; label: string }> = RANGE_PRESETS.map(
  ({ value, label }) => ({ value, label }),
)

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
  const [customOpen, setCustomOpen] = useState(range.preset === 'custom')
  const [customStart, setCustomStart] = useState(range.startStr)
  const [customEnd, setCustomEnd] = useState(range.endStr)
  const [customError, setCustomError] = useState('')
  const [exportOpen, setExportOpen] = useState(false)

  const maxDate = todayInput()

  const handlePresetClick = (preset: AnalyticsPreset) => {
    setCustomError('')
    setExportOpen(false)

    if (preset === 'custom') {
      if (range.preset !== 'custom') {
        const span = diffDays(range.start, range.end) + 1
        const nextStart = toDateInput(addDays(range.end, -(span - 1)))
        setCustomStart(nextStart)
        setCustomEnd(range.endStr)
        const next = getCustomRange(nextStart, range.endStr)
        if (next) onRangeChange(next)
      }
      setCustomOpen(true)
      return
    }

    setCustomOpen(false)
    onRangeChange(getPresetRange(preset))
  }

  const applyCustomRange = () => {
    const next = getCustomRange(customStart, customEnd)
    if (!next) {
      setCustomError('Choose a valid range of up to 365 days ending today or earlier.')
      return
    }
    setCustomError('')
    onRangeChange(next)
  }

  return (
    <div className="flex flex-col items-stretch gap-2 print:hidden sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        <div
          role="group"
          aria-label="Analytics range"
          className="flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-card"
        >
          {RANGE_OPTIONS.map((option) => {
            const active = option.value === range.preset

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handlePresetClick(option.value)}
                aria-pressed={active}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
                  active
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={compare}
          onClick={() => onCompareChange(!compare)}
          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
            compare
              ? 'border-brand-200 bg-brand-50 text-brand-700'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span
            className={`relative h-3.5 w-6 rounded-full transition-colors ${
              compare ? 'bg-brand-600' : 'bg-slate-300'
            }`}
            aria-hidden="true"
          >
            <span
              className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white transition-all ${
                compare ? 'left-3' : 'left-0.5'
              }`}
            />
          </span>
          Compare
        </button>

        <div className="relative">
          {exportOpen && (
            <button
              type="button"
              aria-hidden="true"
              tabIndex={-1}
              className="fixed inset-0 z-10 cursor-default"
              onClick={() => setExportOpen(false)}
            />
          )}
          <button
            type="button"
            onClick={() => setExportOpen((open) => !open)}
            disabled={disabled}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-card transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            aria-expanded={exportOpen}
            aria-haspopup="menu"
          >
            Export
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          {exportOpen && (
            <div
              role="menu"
              className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-elevated"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setExportOpen(false)
                  onExportCsv()
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Download CSV
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setExportOpen(false)
                  onExportPdf()
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Print / Save as PDF
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
          {formatRangeLabel(range)}
        </span>
        <span className="font-medium capitalize">{range.granularity}</span>
      </div>

      {customOpen && (
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-card">
          <label className="text-[11px] font-medium text-slate-500">
            Start
            <input
              type="date"
              value={customStart}
              max={customEnd || maxDate}
              onChange={(event) => setCustomStart(event.target.value)}
              className="mt-1 block rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </label>
          <label className="text-[11px] font-medium text-slate-500">
            End
            <input
              type="date"
              value={customEnd}
              min={customStart}
              max={maxDate}
              onChange={(event) => setCustomEnd(event.target.value)}
              className="mt-1 block rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </label>
          <button
            type="button"
            onClick={applyCustomRange}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Apply
          </button>
          {customError && <p className="w-full text-xs text-rose-600">{customError}</p>}
        </div>
      )}

      {compare && comparisonReason && (
        <p className="text-xs text-amber-600">{comparisonReason}</p>
      )}
    </div>
  )
}
