import type { FareBreakdown } from "@/types/platformConfig";

const toNumber = (value: unknown, fallback = 0) => {
  const amount = Number(value);

  return Number.isFinite(amount) ? amount : fallback;
};

type FareInput = {
  baseFare: unknown;
  pricePerKm: unknown;
  pricePerMinute?: unknown;
  surgePercent: unknown;
  distanceKm: unknown;
  minutes?: unknown;
  isPeak: boolean;
};

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
