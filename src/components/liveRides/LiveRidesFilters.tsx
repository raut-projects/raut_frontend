"use client";

import { useState, useMemo } from "react";
import { Search, Filter, User, Users, Map as MapIcon, List } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import type { LiveRide } from "@/lib/liveRides";
import { LIVE_RIDE_FILTER_STATUSES, LIVE_RIDE_FILTER_TYPES } from "@/lib/liveRides";

type LiveRidesFiltersProps = {
  status: string;
  type: string;
  driverQuery: string;
  customerQuery: string;
  rideId: string;
  issuesOnly: boolean;
  viewMode: string;
  rides: LiveRide[];
  onStatusChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  onDriverChange: (v: string) => void;
  onCustomerChange: (v: string) => void;
  onRideIdChange: (v: string) => void;
  onIssuesToggle: (v: boolean) => void;
  onViewModeChange: (v: string) => void;
  onDriverSelect: (name: string) => void;
  onCustomerSelect: (name: string) => void;
};

const statusOptions = [
  { value: "all", label: "All statuses" },
  ...LIVE_RIDE_FILTER_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) })),
];

const typeOptions = [
  { value: "all", label: "All types" },
  ...LIVE_RIDE_FILTER_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) })),
];

export function LiveRidesFilters({
  status,
  type,
  driverQuery,
  customerQuery,
  rideId,
  issuesOnly,
  viewMode,
  rides,
  onStatusChange,
  onTypeChange,
  onDriverChange,
  onCustomerChange,
  onRideIdChange,
  onIssuesToggle,
  onViewModeChange,
  onDriverSelect,
  onCustomerSelect,
}: LiveRidesFiltersProps) {
  const [driverOpen, setDriverOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);

  const driverSuggestions = useMemo(() => {
    const seen = new Set<string>();
    return rides
      .flatMap((r) => [r.driver.name])
      .filter((n) => {
        if (seen.has(n)) return false;
        seen.add(n);
        return true;
      })
      .slice(0, 8);
  }, [rides]);

  const customerSuggestions = useMemo(() => {
    const seen = new Set<string>();
    return rides
      .flatMap((r) => r.customers.map((c) => c.name))
      .filter((n) => {
        if (seen.has(n)) return false;
        seen.add(n);
        return true;
      })
      .slice(0, 8);
  }, [rides]);

  const match = (q: string) => (s: string) =>
    s.toLowerCase().includes(q.toLowerCase());

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 border-b border-slate-200 pb-3">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-500" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Filters</span>
      </div>

      <div className="flex items-center gap-2 min-w-[200px]">
        <label className="flex items-center gap-1.5 text-xs text-slate-600">
          <Search className="w-3 h-3" />
          Status
        </label>
        <select
          value={ status }
          onChange={ (e) => onStatusChange(e.target.value) }
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          { statusOptions.map((o) => (
            <option key={ o.value } value={ o.value }>
              { o.label }
            </option>
          )) }
        </select>
      </div>

      <div className="flex items-center gap-2 min-w-[200px]">
        <label className="flex items-center gap-1.5 text-xs text-slate-600">
          <Users className="w-3 h-3" />
          Type
        </label>
        <select
          value={ type }
          onChange={ (e) => onTypeChange(e.target.value) }
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          { typeOptions.map((o) => (
            <option key={ o.value } value={ o.value }>
              { o.label }
            </option>
          )) }
        </select>
      </div>

      <SearchField
        icon={ User }
        label="Driver"
        value={ driverQuery }
        placeholder="Driver name or ID"
        onChange={ onDriverChange }
        open={ driverOpen }
        setOpen={ setDriverOpen }
        suggestions={ driverSuggestions }
        onSelect={ onDriverSelect }
        query={ driverQuery }
      />

      <SearchField
        icon={ Users }
        label="Customer"
        value={ customerQuery }
        placeholder="Customer name"
        onChange={ onCustomerChange }
        open={ customerOpen }
        setOpen={ setCustomerOpen }
        suggestions={ customerSuggestions }
        onSelect={ onCustomerSelect }
        query={ customerQuery }
      />

      <div className="flex items-center gap-2 min-w-[150px]">
        <label className="flex items-center gap-1.5 text-xs text-slate-600">
          <Search className="w-3 h-3" />
          Ride ID
        </label>
        <input
          value={ rideId }
          onChange={ (e) => onRideIdChange(e.target.value) }
          placeholder="RD-......"
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 select-none">
          <input
            type="checkbox"
            checked={ issuesOnly }
            onChange={ (e) => onIssuesToggle(e.target.checked) }
            className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Issues only
        </label>
      </div>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <div className="flex items-center gap-1">
        <span className="text-xs text-slate-500">View</span>
        <ToggleGroup
          type="single"
          value={ viewMode }
          onValueChange={ onViewModeChange }
          className="rounded-lg border border-slate-200"
        >
          <ToggleGroupItem value="map" title="Map only">
            <MapIcon className="w-3 h-3" />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" title="List only">
            <List className="w-3 h-3" />
          </ToggleGroupItem>
          <ToggleGroupItem value="both" title="Both">
            <span className="sr-only">Both</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}

function SearchField({
  icon: Icon,
  label,
  value,
  placeholder,
  onChange,
  open,
  setOpen,
  suggestions,
  onSelect,
  query,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  suggestions: string[];
  onSelect: (name: string) => void;
  query: string;
}) {
  const filtered = query ? suggestions.filter((s) => s.toLowerCase().includes(query.toLowerCase())) : suggestions;
  return (
    <div className="relative min-w-42.5" onMouseEnter={ () => setOpen(true) } onMouseLeave={ () => setOpen(false) }>
      <label className="flex items-center gap-1.5 text-xs text-slate-600">
        <Icon className="w-3 h-3" />
        { label }
      </label>
      <input
        value={ value }
        onChange={ (e) => {
          setOpen(true);
          onChange(e.target.value);
        } }
        onFocus={ () => setOpen(true) }
        onBlur={ () => setTimeout(() => setOpen(false), 150) }
        placeholder={ placeholder }
        className="rounded-lg border border-slate-200 bg-white pl-8 pr-2.5 py-1.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
    </div>
  );
}
