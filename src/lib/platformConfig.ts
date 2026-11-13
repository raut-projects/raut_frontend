// Fare calculation for the platform config preview. Turns base fare, distance,
// time and surge inputs into a FareBreakdown. Every numeric input is coerced
// and clamped so malformed config values cannot yield negative or NaN amounts.

import type { FareBreakdown } from "@/types/platformConfig";

/** Coerces a value to a finite number, falling back to `fallback` (default 0). */
const toNumber = (value: unknown, fallback = 0) => {
  const amount = Number(value);

  return Number.isFinite(amount) ? amount : fallback;
};

/** Inputs for {@link calculateFare}. Distances are km, time is minutes. */
type FareInput = {
  baseFare: unknown;
  pricePerKm: unknown;
  pricePerMinute?: unknown;
  surgePercent: unknown;
  distanceKm: unknown;
  minutes?: unknown;
  isPeak: boolean;
};

/**
 * Computes a fare breakdown from configuration-style inputs.
 *
 * - `base`, `distance` (km × pricePerKm) and `time` (minutes × pricePerMinute)
 *   are each clamped to zero or more.
 * - `surge` is `subtotal × surgePercent/100`, applied only when `isPeak` is
 *   true, otherwise zero.
 * - `total` is subtotal plus surge.
 *
 * Missing or non-numeric inputs are treated as 0.
 */
export const calculateFare = ({
  baseFare,
  pricePerKm,
  pricePerMinute = 0,
  surgePercent,
  distanceKm,
  minutes = 0,
  isPeak,
}: FareInput): FareBreakdown => {
  const base = Math.max(0, toNumber(baseFare));
  const distance =
    Math.max(0, toNumber(distanceKm)) * Math.max(0, toNumber(pricePerKm));
  const time =
    Math.max(0, toNumber(minutes)) * Math.max(0, toNumber(pricePerMinute));
  const subtotal = base + distance + time;
  const surge = isPeak
    ? subtotal * (Math.max(0, toNumber(surgePercent)) / 100)
    : 0;

  return {
    base,
    distance,
    time,
    subtotal,
    surge,
    total: subtotal + surge,
  };
};
