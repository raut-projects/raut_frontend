"use client";

import { useState } from "react";

import {
  ConfigCard,
  ConfigField,
} from "@/components/platformConfig/ConfigPrimitives";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { calculateFare } from "@/lib/platformConfig";
import { formatMoney } from "@/services/mappers";

export type FareVehicle = {
  label: string;
  baseFare: string;
  pricePerKm: string;
};

export function FareCalculator({
  vehicles,
  surgePercent,
}: {
  vehicles: FareVehicle[];
  surgePercent: string;
}) {
  const [vehicleLabel, setVehicleLabel] = useState(vehicles[0]?.label ?? "");
  const [distance, setDistance] = useState("7.3");
  const [isPeak, setIsPeak] = useState(true);

  const vehicle =
    vehicles.find((option) => option.label === vehicleLabel) ?? vehicles[0];

  const fare = calculateFare({
    baseFare: vehicle?.baseFare,
    pricePerKm: vehicle?.pricePerKm,
    surgePercent,
    distanceKm: distance,
    isPeak,
  });

  const rows = [
    { label: "Base fare", value: fare.base },
    { label: `Distance (${distance || 0} km)`, value: fare.distance },
    { label: "Subtotal", value: fare.subtotal },
    {
      label: isPeak ? `Surge (${surgePercent || 0}%)` : "Surge",
      value: fare.surge,
    },
  ];

  return (
    <ConfigCard
      title="Fare calculator"
      description="Preview a fare with the values currently in the form."
      className="xl:sticky xl:top-4"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <ConfigField label="Vehicle" htmlFor="fare-vehicle">
            <select
              id="fare-vehicle"
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
          <ConfigField label="Distance (km)" htmlFor="fare-distance">
            <Input
              id="fare-distance"
              type="number"
              min="0"
              step="0.1"
              value={ distance }
              onChange={ (event) => setDistance(event.target.value) }
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
          { rows.map((row, index) => (
            <div
              key={ row.label }
              className={
                index === 2
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
          <span className="text-sm font-medium">Estimated total</span>
          <span className="text-base font-bold tabular-nums">
            { formatMoney(fare.total) }
          </span>
        </div>

        <p className="text-xs text-slate-500">
          The calculator does not save anything.
        </p>
      </div>
    </ConfigCard>
  );
}
