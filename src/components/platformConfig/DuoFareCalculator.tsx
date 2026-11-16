"use client";

import { useState } from "react";

import {
  ConfigCard,
  ConfigField,
} from "@/components/platformConfig/ConfigPrimitives";
import type { FareVehicle } from "@/components/platformConfig/FareCalculator";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { calculateDuoFare, calculateFare } from "@/lib/platformConfig";
import { formatMoney } from "@/services/mappers";

const BOLD_ROWS = new Set(["Gross fare", "Collected total"]);

export function DuoFareCalculator({
  vehicles,
  surgePercent,
  pricePerMinute = "0",
  hostDiscountPercent,
  coriderDiscountPercent,
  coriderMaxFareRatio,
  commissionPercent,
  maxCoRiders,
}: {
  vehicles: FareVehicle[];
  surgePercent: string;
  pricePerMinute?: string;
  hostDiscountPercent: string;
  coriderDiscountPercent: string;
  coriderMaxFareRatio: string;
  commissionPercent: string;
  maxCoRiders: string;
}) {
  const [vehicleLabel, setVehicleLabel] = useState(vehicles[0]?.label ?? "");
  const [distance, setDistance] = useState("7.3");
  const [minutes, setMinutes] = useState("12");
  const [isPeak, setIsPeak] = useState(true);
  const [coRiders, setCoRiders] = useState("1");

  const vehicle =
    vehicles.find((option) => option.label === vehicleLabel) ?? vehicles[0];

  const maxCoriderCount = Math.max(1, Math.floor(Number(maxCoRiders) || 1));
  const coRiderCount = Math.min(
    Math.max(1, Math.floor(Number(coRiders) || 1)),
    maxCoriderCount,
  );

  const fare = calculateFare({
    baseFare: vehicle?.baseFare,
    pricePerKm: vehicle?.pricePerKm,
    pricePerMinute,
    surgePercent,
    distanceKm: distance,
    minutes,
    isPeak,
  });

  const duo = calculateDuoFare({
    baseFare: vehicle?.baseFare,
    pricePerKm: vehicle?.pricePerKm,
    pricePerMinute,
    surgePercent,
    distanceKm: distance,
    minutes,
    isPeak,
    hostDiscountPercent,
    coriderDiscountPercent,
    coriderMaxFareRatio,
    commissionPercent,
    coRiders: coRiderCount,
  });

  const rows = [
    { label: "Base fare", value: fare.base },
    { label: `Distance (${distance || 0} km)`, value: fare.distance },
    { label: `Time (${minutes || 0} min)`, value: fare.time },
    { label: "Surge", value: fare.surge },
    { label: "Gross fare", value: duo.gross },
    {
      label: `Host pays (after ${hostDiscountPercent || 0}%)`,
      value: duo.hostPays,
    },
    {
      label: `Co-rider fare (after ${coriderDiscountPercent || 0}%)`,
      value: duo.coriderFare,
    },
    { label: `Co-riders ×${coRiderCount}`, value: duo.coriderTotal },
    { label: "Collected total", value: duo.collected },
    { label: `Platform fee (${commissionPercent || 0}%)`, value: duo.platformFee },
  ];

  return (
    <ConfigCard
      title="DUO fare calculator"
      description="Estimate host, co-rider and driver amounts from the values in the form. Revenue-pool split, overlap bonus and subsidies are not modelled."
      className="self-start xl:sticky xl:top-20"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <ConfigField label="Vehicle" htmlFor="duo-fare-vehicle">
            <select
              id="duo-fare-vehicle"
              value={ vehicle?.label ?? "" }
              onChange={ (event) => setVehicleLabel(event.target.value) }
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-800 outline-none focus-visible:border-brand-400 focus-visible:ring-3 focus-visible:ring-brand-100"
            >
              { vehicles.map((option) => (
                <option key={ option.label } value={ option.label }>
                  { option.label }
                </option>
              )) }
            </select>
          </ConfigField>
          <ConfigField label="Distance (km)" htmlFor="duo-fare-distance">
            <Input
              id="duo-fare-distance"
              type="number"
              min="0"
              step="0.1"
              value={ distance }
              onChange={ (event) => setDistance(event.target.value) }
              className="h-9 border-slate-200 bg-white"
            />
          </ConfigField>
          <ConfigField label="Time (min)" htmlFor="duo-fare-minutes">
            <Input
              id="duo-fare-minutes"
              type="number"
              min="0"
              step="1"
              value={ minutes }
              onChange={ (event) => setMinutes(event.target.value) }
              className="h-9 border-slate-200 bg-white"
            />
          </ConfigField>
          <ConfigField label="Co-riders" htmlFor="duo-fare-coriders">
            <Input
              id="duo-fare-coriders"
              type="number"
              min="1"
              max={ maxCoriderCount }
              step="1"
              value={ coRiders }
              onChange={ (event) => setCoRiders(event.target.value) }
              className="h-9 border-slate-200 bg-white"
            />
          </ConfigField>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
          <div>
            <p className="text-sm font-medium text-slate-800">Peak hours</p>
            <p className="text-xs text-slate-500">
              Include the configured surge multiplier.
            </p>
          </div>
          <Switch
            checked={ isPeak }
            onCheckedChange={ setIsPeak }
            aria-label="Apply surge"
          />
        </div>

        <dl className="space-y-2 text-sm">
          { rows.map((row) => (
            <div
              key={ row.label }
              className={
                BOLD_ROWS.has(row.label)
                  ? "flex items-center justify-between border-t border-slate-200 pt-2 font-medium text-slate-700"
                  : "flex items-center justify-between text-slate-600"
              }
            >
              <dt>{ row.label }</dt>
              <dd className="tabular-nums">{ formatMoney(row.value) }</dd>
            </div>
          )) }
        </dl>

        <div className="flex items-center justify-between rounded-lg bg-slate-900 px-3 py-3 text-white">
          <span className="text-sm font-medium">Driver earning</span>
          <span className="text-base font-bold tabular-nums">
            { formatMoney(duo.driverEarning) }
          </span>
        </div>
      </div>
    </ConfigCard>
  );
}
