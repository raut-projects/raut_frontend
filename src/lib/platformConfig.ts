import {
  PEAK_HOUR_DAYS,
  type AutoPayoutSchedule,
  type FeatureFlags,
  type FareBreakdown,
  type OperationsConfig,
  type OperationsDraft,
  type PeakHourDay,
  type PeakHourSlotDraft,
  type PricingConfig,
  type PricingDraft,
} from "@/types/platformConfig";

export const DAY_LABELS: Record<PeakHourDay, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export const DAY_SHORT_LABELS: Record<PeakHourDay, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

export const AUTO_PAYOUT_OPTIONS: {
  value: AutoPayoutSchedule;
  label: string;
  description: string;
}[] = [
  {
    value: "weekly",
    label: "Weekly (Every Monday)",
    description: "Process payouts every Monday.",
  },
  {
    value: "biweekly",
    label: "Bi-weekly (1st & 15th)",
    description: "Process payouts on the 1st and 15th of each month.",
  },
  {
    value: "monthly",
    label: "Monthly (1st of month)",
    description: "Process payouts on the first day of each month.",
  },
];

const toNumber = (value: unknown, fallback = 0) => {
  const amount = Number(value);

  return Number.isFinite(amount) ? amount : fallback;
};

let slotSequence = 0;

export const createPeakHourSlot = (
  day: PeakHourDay,
  start = "07:00",
  end = "09:00",
): PeakHourSlotDraft => {
  slotSequence += 1;

  return {
    id: `${day}-${Date.now()}-${slotSequence}`,
    day,
    start,
    end,
    enabled: true,
  };
};

export const toPricingDraft = (config: PricingConfig): PricingDraft => ({
  base_fare_tzs: String(config.base_fare_tzs ?? ""),
  price_per_km_tzs: String(config.price_per_km_tzs ?? ""),
  price_per_minute_tzs: String(config.price_per_minute_tzs ?? ""),
  platform_fee_percent: String(config.platform_fee_percent ?? ""),
  peak_hour_surge_percent: String(config.peak_hour_surge_percent ?? ""),
  duo_discount_percent: String(config.duo_discount_percent ?? ""),
  duo_distribution_percent: String(config.duo_distribution_percent ?? ""),
  peak_hours: (config.peak_hours ?? []).map((slot, index) => ({
    ...slot,
    id: `${slot.day}-${index}-${slot.start}-${slot.end}`,
    enabled: true,
  })),
});

export const toOperationsDraft = (
  config: OperationsConfig,
): OperationsDraft => ({
  min_payout_amount_tzs: String(config.min_payout_amount_tzs ?? ""),
  auto_payout_schedule: config.auto_payout_schedule ?? "weekly",
  document_expiry_reminder_days: String(
    config.document_expiry_reminder_days ?? "",
  ),
  max_concurrent_requests: String(config.max_concurrent_requests ?? ""),
  request_timeout_seconds: String(config.request_timeout_seconds ?? ""),
  session_token_expiry_minutes: String(
    config.session_token_expiry_minutes ?? "",
  ),
});

export const toFeatureFlagsDraft = (flags: FeatureFlags): FeatureFlags => ({
  scheduled_rides: Boolean(flags.scheduled_rides),
  duo: Boolean(flags.duo),
  ratings: Boolean(flags.ratings),
  in_app_chat: Boolean(flags.in_app_chat),
  corporate_accounts: Boolean(flags.corporate_accounts),
});

type FareInput = {
  baseFare: unknown;
  pricePerKm: unknown;
  pricePerMinute: unknown;
  surgePercent: unknown;
  distanceKm: unknown;
  minutes: unknown;
  isPeak: boolean;
};

export const calculateFare = ({
  baseFare,
  pricePerKm,
  pricePerMinute,
  surgePercent,
  distanceKm,
  minutes,
  isPeak,
}: FareInput): FareBreakdown => {
  const base = Math.max(0, toNumber(baseFare));
  const distance = Math.max(0, toNumber(distanceKm)) * Math.max(0, toNumber(pricePerKm));
  const time = Math.max(0, toNumber(minutes)) * Math.max(0, toNumber(pricePerMinute));
  const subtotal = base + distance + time;
  const surge = isPeak ? subtotal * (Math.max(0, toNumber(surgePercent)) / 100) : 0;

  return {
    base,
    distance,
    time,
    subtotal,
    surge,
    total: subtotal + surge,
  };
};

export const sortPeakHourSlots = (slots: PeakHourSlotDraft[]) =>
  [...slots].sort((left, right) => left.start.localeCompare(right.start));

export const groupPeakHoursByDay = (slots: PeakHourSlotDraft[]) => {
  const grouped = Object.fromEntries(
    PEAK_HOUR_DAYS.map((day) => [day, [] as PeakHourSlotDraft[]]),
  ) as Record<PeakHourDay, PeakHourSlotDraft[]>;

  slots
    .filter((slot) => slot.enabled && slot.start && slot.end)
    .forEach((slot) => {
      grouped[slot.day].push(slot);
    });

  PEAK_HOUR_DAYS.forEach((day) => {
    grouped[day] = sortPeakHourSlots(grouped[day]);
  });

  return grouped;
};

const slotSignature = (slots: PeakHourSlotDraft[]) =>
  slots.map((slot) => `${slot.start}–${slot.end}`).join(", ");

export const formatPeakHoursLabel = (slots: PeakHourSlotDraft[]) => {
  const grouped = groupPeakHoursByDay(slots);
  const signatures = Object.fromEntries(
    PEAK_HOUR_DAYS.map((day) => [day, slotSignature(grouped[day])]),
  ) as Record<PeakHourDay, string>;

  const weekdays = PEAK_HOUR_DAYS.slice(0, 5);
  const weekdaySignature = signatures.monday;
  const weekdaysMatch =
    Boolean(weekdaySignature) &&
    weekdays.every((day) => signatures[day] === weekdaySignature);
  const weekendEmpty = !signatures.saturday && !signatures.sunday;

  if (weekdaysMatch && weekendEmpty) {
    return `Mon–Fri ${weekdaySignature}`;
  }

  const parts = PEAK_HOUR_DAYS.filter((day) => signatures[day]).map(
    (day) => `${DAY_SHORT_LABELS[day]} ${signatures[day]}`,
  );

  return parts.length ? parts.join(" · ") : "No peak hours configured";
};

export const formatHistoryValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Enabled" : "Disabled";
  if (typeof value === "number") return value.toLocaleString("en-US");

  return String(value);
};

export const formatFieldName = (field: string) => {
  const name = String(field ?? "")
    .replace(/_tzs$/, "")
    .replace(/_percent$/, " (%)")
    .replace(/_/g, " ")
    .trim();

  return name ? name.charAt(0).toUpperCase() + name.slice(1) : "setting";
};

export const formatHistoryChange = (entry: {
  field: string;
  old_value: unknown;
  new_value: unknown;
}) => {
  const field = formatFieldName(entry.field);
  const oldValue = entry.old_value;
  const newValue = entry.new_value;

  if (typeof newValue === "boolean") {
    const setting = field.charAt(0).toLowerCase() + field.slice(1);

    return `${newValue ? "Enabled" : "Disabled"} ${setting}`;
  }

  if (oldValue === null || oldValue === undefined || oldValue === "") {
    return `Set ${field} to ${formatHistoryValue(newValue)}`;
  }

  return `Changed ${field} from ${formatHistoryValue(oldValue)} to ${formatHistoryValue(newValue)}`;
};

export const maskIdentifier = (value: string) => {
  const identifier = String(value ?? "").trim();

  if (!identifier) return "Not provided";
  if (identifier.length <= 4) return `...${identifier}`;

  return `...${identifier.slice(-4)}`;
};
