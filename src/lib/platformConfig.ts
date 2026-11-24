// Fare calculation for the platform config preview. Turns base fare, distance,
// time and surge inputs into a FareBreakdown. Every numeric input is coerced
// and clamped so malformed config values cannot yield negative or NaN amounts.

import type { DuoFareBreakdown, FareBreakdown } from "@/types/platformConfig";

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

/** Inputs for {@link calculateDuoFare}; discounts and commission are percentages. */
type DuoFareInput = {
  baseFare: unknown;
  pricePerKm: unknown;
  pricePerMinute?: unknown;
  surgePercent: unknown;
  distanceKm: unknown;
  minutes?: unknown;
  isPeak: boolean;
  hostDiscountPercent: unknown;
  coriderDiscountPercent: unknown;
  coriderMaxFareRatio: unknown;
  commissionPercent: unknown;
  coRiders?: unknown;
};

// Clamps a percentage input to 0..100.
const clampPercent = (value: unknown) =>
  Math.min(100, Math.max(0, toNumber(value)));

/**
 * Estimates a DUO fare from the shared base fare and the DUO discount/commission
 * settings.
 *
 * The gross fare uses {@link calculateFare}; the host pays it less the host
 * discount, and each co-rider pays it less the co-rider discount, capped at
 * `coriderMaxFareRatio` of the gross. The platform fee is the commission on the
 * collected total, and the driver earns the remainder. This is a simplified
 * preview: revenue-pool split, overlap bonus and subsidies are not modelled.
 */
export const calculateDuoFare = ({
  baseFare,
  pricePerKm,
  pricePerMinute = 0,
  surgePercent,
  distanceKm,
  minutes = 0,
  isPeak,
  hostDiscountPercent,
  coriderDiscountPercent,
  coriderMaxFareRatio,
  commissionPercent,
  coRiders = 0,
}: DuoFareInput): DuoFareBreakdown => {
  const gross = calculateFare({
    baseFare,
    pricePerKm,
    pricePerMinute,
    surgePercent,
    distanceKm,
    minutes,
    isPeak,
  }).total;

  const hostPays = gross * (1 - clampPercent(hostDiscountPercent) / 100);
  const discountedCorider =
    gross * (1 - clampPercent(coriderDiscountPercent) / 100);
  const maxCoriderFare = gross * Math.max(0, toNumber(coriderMaxFareRatio));
  const coriderFare = Math.min(discountedCorider, maxCoriderFare);
  const coriderTotal = coriderFare * Math.max(0, Math.floor(toNumber(coRiders)));
  const collected = hostPays + coriderTotal;
  const platformFee = collected * (clampPercent(commissionPercent) / 100);

  return {
    gross,
    hostPays,
    coriderFare,
    coriderTotal,
    collected,
    platformFee,
    driverEarning: collected - platformFee,
  };
};

/** One peak-hour window; times are "HH:MM" strings. */
export type PeakHourSlot = { start: string; end: string };

/** Peak-hour windows keyed by lowercase three-letter day id (mon..sun). */
export type PeakHoursSchedule = Record<string, PeakHourSlot[]>;

/** Day ids used by the peak-hours editor, in week order. */
export const PEAK_DAYS = [
  { id: "mon", label: "Monday" },
  { id: "tue", label: "Tuesday" },
  { id: "wed", label: "Wednesday" },
  { id: "thu", label: "Thursday" },
  { id: "fri", label: "Friday" },
  { id: "sat", label: "Saturday" },
  { id: "sun", label: "Sunday" },
] as const;

// Turns "07:00" into the compact legacy form ("7", or "7:30" when minutes are set).
const compactTime = (time: string) => {
  const [hours, minutes] = String(time ?? "").split(":");
  if (!hours) return "";
  return minutes && minutes !== "00" ? `${Number(hours)}:${minutes}` : String(Number(hours));
};

// Pads "7:30" to "07:30" for the time inputs.
const paddedTime = (time: string) => {
  const [hours = "", minutes = "00"] = String(time ?? "").split(":");
  if (!hours) return "";
  return `${hours.padStart(2, "0")}:${(minutes || "00").padStart(2, "0")}`;
};

// Parses the legacy "7-9,17-19" string into slots applied to Monday–Friday.
const parseLegacyHours = (value: string): PeakHoursSchedule => {
  const slots = String(value ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [start, end] = part.split("-").map((entry) => entry.trim());
      return { start: paddedTime(start), end: paddedTime(end) };
    })
    .filter((slot) => slot.start && slot.end);

  return PEAK_DAYS.reduce<PeakHoursSchedule>((schedule, day) => {
    schedule[day.id] = day.id === "sat" || day.id === "sun" ? [] : slots.map((slot) => ({ ...slot }));
    return schedule;
  }, {});
};

/**
 * Reads a `surge.peak_hours` value into a per-day schedule.
 *
 * Prefers the structured `schedule` JSON string when present and valid,
 * otherwise falls back to parsing the legacy `hours` string.
 */
export function parsePeakHours(value: unknown): PeakHoursSchedule {
  const empty = PEAK_DAYS.reduce<PeakHoursSchedule>((schedule, day) => {
    schedule[day.id] = [];
    return schedule;
  }, {});

  if (!value || typeof value !== "object") return empty;

  const record = value as Record<string, unknown>;
  const raw = record.schedule;

  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as Record<string, PeakHourSlot[]>;
      return PEAK_DAYS.reduce<PeakHoursSchedule>((schedule, day) => {
        const slots = Array.isArray(parsed[day.id]) ? parsed[day.id] : [];
        schedule[day.id] = slots
          .map((slot) => ({
            start: paddedTime(slot?.start ?? ""),
            end: paddedTime(slot?.end ?? ""),
          }))
          .filter((slot) => slot.start && slot.end);
        return schedule;
      }, {});
    } catch {
      // Fall through to the legacy string below.
    }
  }

  return parseLegacyHours(typeof record.hours === "string" ? record.hours : "");
}

/**
 * Serialises a per-day schedule into the `surge.peak_hours` value shape.
 *
 * Returns the legacy `hours` string (derived from the first day with slots)
 * alongside a `schedule` JSON string so the editor can round-trip per-day data.
 */
export function serializePeakHours(schedule: PeakHoursSchedule): {
  hours: string;
  schedule: string;
} {
  const firstDay = PEAK_DAYS.map((day) => schedule[day.id] ?? []).find(
    (slots) => slots.length,
  );

  const hours = (firstDay ?? [])
    .map((slot) => `${compactTime(slot.start)}-${compactTime(slot.end)}`)
    .filter((entry) => entry !== "-")
    .join(",");

  return { hours, schedule: JSON.stringify(schedule) };
}
