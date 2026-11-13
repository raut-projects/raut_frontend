// Configuration registry for the platform settings screens. Maps backend config
// records to typed field specs, drives the draft -> diff -> updates flow, and
// organizes fields into pricing tabs, feature flags and operations sections.
// Value keys let a field read/write a named property inside a record's value
// object, and unit metadata drives display formatting.

import type {
  ConfigRecord,
  ConfigUpdate,
  ConfigValue,
  FieldErrors,
} from "@/types/platformConfig";

/** Input control rendered for a config field. */
export type ConfigFieldType = "number" | "text" | "switch" | "select";

/** Unit used to format and label a config field's value. */
export type ConfigFieldUnit =
  | "money"
  | "percent"
  | "multiplier"
  | "ratio"
  | "minutes"
  | "seconds"
  | "meters"
  | "km"
  | "count";

/**
 * Declarative spec for one config field.
 *
 * `key` is the config record key; `valueKey` names the property to read/write
 * inside the record's value object (defaults to "value" or "enabled").
 */
export type ConfigFieldSpec = {
  key: string;
  label: string;
  type: ConfigFieldType;
  valueKey?: string;
  unit?: ConfigFieldUnit;
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  options?: { label: string; value: string }[];
};

/** A titled group of config fields. */
export type ConfigSectionSpec = {
  id: string;
  title: string;
  description?: string;
  fields: ConfigFieldSpec[];
};

/** Identifier for each pricing tab. */
export type PricingTabId = "duo" | "private" | "public";

/** A pricing tab with its grouped sections. */
export type PricingTabSpec = {
  id: PricingTabId;
  label: string;
  description: string;
  sections: ConfigSectionSpec[];
};

/** Editable draft state: config key to its string or boolean value. */
export type ConfigDraft = Record<string, string | boolean>;

// Identity helper that keeps field-spec literals type-checked.
const field = (spec: ConfigFieldSpec): ConfigFieldSpec => spec;

// Shorthands for common number field specs.
const money = (
  key: string,
  label: string,
  hint?: string,
  extra: Partial<ConfigFieldSpec> = {},
) => field({ key, label, type: "number", unit: "money", hint, ...extra });

const percent = (
  key: string,
  label: string,
  hint?: string,
  extra: Partial<ConfigFieldSpec> = {},
) => field({ key, label, type: "number", unit: "percent", hint, ...extra });

const multiplier = (
  key: string,
  label: string,
  hint?: string,
  extra: Partial<ConfigFieldSpec> = {},
) =>
  field({
    key,
    label,
    type: "number",
    unit: "multiplier",
    step: 0.1,
    hint,
    ...extra,
  });

// Feature-flag field spec; toggles read and write the "enabled" value key.
const toggle = (key: string, label: string, hint?: string) =>
  field({ key, label, type: "switch", valueKey: "enabled", hint });

/**
 * Field specs for known config keys, keyed by config key. Records without an
 * entry fall back to a spec inferred from their value (see fieldSpecFor).
 */
export const CONFIG_FIELDS: Record<string, ConfigFieldSpec> =
  Object.fromEntries(
    [
      // DUO — commission and revenue.
      field({
        key: "duo.commission_type",
        label: "Commission model",
        type: "text",
        valueKey: "type",
        hint: "Model used to split DUO commission between host and co-riders.",
      }),
      percent(
        "commission.duo_ride",
        "DUO ride commission",
        "Share of the host fare.",
      ),
      percent(
        "commission.duo_additional_rate",
        "Additional co-rider commission",
        "Applied to each extra co-rider.",
      ),
      toggle(
        "commission.duo_additional_exempt",
        "Exempt additional co-rider commission",
        "Do not charge commission on extra co-riders.",
      ),
      toggle(
        "duo.two_stream_commission",
        "Two-stream commission",
        "Charge commission separately for the host and co-rider streams.",
      ),
      percent(
        "duo.revenue_pool_split",
        "Revenue pool split",
        "Share of the fare placed in the shared revenue pool.",
      ),
      percent(
        "duo.contribution_split",
        "Contribution split",
        "How the shared revenue pool is divided between participants.",
      ),
      field({
        key: "duo.min_total_revenue_ratio",
        label: "Minimum revenue ratio",
        type: "number",
        unit: "ratio",
        step: 0.01,
        hint: "Floor for total DUO revenue relative to a solo ride.",
      }),

      // DUO — discounts and subsidies.
      percent(
        "duo.host_max_discount",
        "Host maximum discount",
        "Cap on the host discount.",
      ),
      percent(
        "duo.host_upfront_discount",
        "Host upfront discount",
        "Discount shown to the host before matching.",
      ),
      percent(
        "duo.corider_base_discount",
        "Co-rider base discount",
        "Discount applied to the co-rider base fare.",
      ),
      field({
        key: "duo.corider_max_fare_ratio",
        label: "Co-rider max fare ratio",
        type: "number",
        unit: "ratio",
        step: 0.01,
        hint: "Highest co-rider fare as a ratio of the host fare.",
      }),
      percent(
        "duo.corider_overlap_bonus",
        "Co-rider overlap bonus",
        "Bonus when the co-rider route overlaps the host route.",
      ),
      money(
        "duo.driver_min_earning_protection",
        "Driver minimum earning protection",
        "Guaranteed minimum earning for DUO drivers.",
      ),
      toggle(
        "duo.raut_subsidizes_unmatched",
        "Raut subsidises unmatched rides",
        "Cover the discount when no co-rider is matched.",
      ),

      // DUO — matching.
      field({
        key: "duo.max_coriders",
        label: "Maximum co-riders",
        type: "number",
        unit: "count",
        min: 1,
        step: 1,
      }),
      field({
        key: "duo.search_radius_km",
        label: "Matching search radius",
        type: "number",
        unit: "km",
        min: 0,
        step: 0.5,
      }),
      toggle("feature.multiple_riders", "DUO rides enabled"),

      // Private (car / XL) and shared pricing.
      money("pricing.base_fare.car", "Car base fare"),
      money("pricing.base_fare.xl", "XL base fare"),
      money("pricing.per_km_rate.car", "Car price per km"),
      money("pricing.per_km_rate.xl", "XL price per km"),
      percent("pricing.commission_default", "Default commission"),
      percent("commission.private_ride", "Private ride commission"),
      money("pricing.min_fare", "Minimum fare"),
      money("pricing.rounding_increment", "Rounding increment"),

      // Surge.
      field({
        key: "surge.peak_hours",
        label: "Peak hours",
        type: "text",
        valueKey: "value",
        placeholder: "Mon–Fri 07:00–09:00, 17:00–19:00",
        hint: "Plain-text schedule used by operations.",
      }),
      multiplier("surge.peak_hours_multiplier", "Peak hours multiplier"),
      field({
        key: "surge.high_demand_threshold",
        label: "High demand threshold",
        type: "number",
        unit: "count",
        min: 0,
        step: 1,
        hint: "Active requests before the high-demand multiplier applies.",
      }),
      multiplier("surge.high_demand_multiplier", "High demand multiplier"),
      field({
        key: "surge.very_high_demand_threshold",
        label: "Very high demand threshold",
        type: "number",
        unit: "count",
        min: 0,
        step: 1,
      }),
      multiplier(
        "surge.very_high_demand_multiplier",
        "Very high demand multiplier",
      ),
      multiplier("surge.max_multiplier", "Maximum surge multiplier"),

      // Public (boda / bajaji).
      money("pricing.base_fare.boda", "Boda base fare"),
      money("pricing.base_fare.bajaji", "Bajaji base fare"),
      money("pricing.per_km_rate.boda", "Boda price per km"),
      money("pricing.per_km_rate.bajaji", "Bajaji price per km"),
      percent("commission.public_ride", "Public ride commission"),

      // Quoting.
      field({
        key: "quote.expiry_seconds",
        label: "Quote expiry",
        type: "number",
        unit: "seconds",
        min: 0,
        step: 1,
      }),
      field({
        key: "quote.join_expiry_seconds",
        label: "Join quote expiry",
        type: "number",
        unit: "seconds",
        min: 0,
        step: 1,
      }),
      field({
        key: "quote.recalculation_threshold_m",
        label: "Recalculation threshold",
        type: "number",
        unit: "meters",
        min: 0,
        step: 10,
      }),
      percent(
        "quote.surge_revalidate_threshold_percent",
        "Surge revalidation threshold",
      ),

      // Ride rules.
      money(
        "ride.after_accept_cancellation_fee_tzs",
        "After-accept cancellation fee",
      ),
      field({
        key: "ride.driver_late_free_cancel_threshold_minutes",
        label: "Driver late free-cancel threshold",
        type: "number",
        unit: "minutes",
        min: 0,
        step: 1,
      }),
      field({
        key: "ride.max_free_waiting_minutes",
        label: "Maximum free waiting time",
        type: "number",
        unit: "minutes",
        min: 0,
        step: 1,
      }),
      field({
        key: "ride.max_join_walk_distance_m",
        label: "Maximum join walk distance",
        type: "number",
        unit: "meters",
        min: 0,
        step: 10,
      }),
      money("ride.no_show_cancellation_fee_tzs", "No-show cancellation fee"),
      money("ride.waiting_charge_per_minute_tzs", "Waiting charge per minute"),

      // Features.
      toggle(
        "feature.promo_codes",
        "Promo codes",
        "Allow customers to redeem promo codes.",
      ),
      toggle(
        "feature.ratings",
        "Ratings",
        "Collect a rating after each completed trip.",
      ),
      toggle(
        "feature.scheduled_routes",
        "Scheduled rides",
        "Let customers book a ride in advance.",
      ),
      toggle(
        "feature.surge_pricing",
        "Surge pricing",
        "Apply demand-based surge multipliers.",
      ),
    ].map((spec) => [spec.key, spec]),
  );

/** Pricing tabs (DUO, private, public) with their grouped field sections. */
export const PRICING_TABS: PricingTabSpec[] = [
  {
    id: "duo",
    label: "DUO ride",
    description:
      "Commission, discounts and matching rules for shared DUO rides.",
    sections: [
      {
        id: "duo-commission",
        title: "Commission & revenue",
        description:
          "How DUO fares are split between the platform and drivers.",
        fields: [
          CONFIG_FIELDS["duo.commission_type"],
          CONFIG_FIELDS["commission.duo_ride"],
          CONFIG_FIELDS["commission.duo_additional_rate"],
          CONFIG_FIELDS["commission.duo_additional_exempt"],
          CONFIG_FIELDS["duo.two_stream_commission"],
          CONFIG_FIELDS["duo.revenue_pool_split"],
          CONFIG_FIELDS["duo.contribution_split"],
          CONFIG_FIELDS["duo.min_total_revenue_ratio"],
        ],
      },
      {
        id: "duo-discounts",
        title: "Discounts & subsidies",
        description: "Discount caps and driver earning protection.",
        fields: [
          CONFIG_FIELDS["duo.host_max_discount"],
          CONFIG_FIELDS["duo.host_upfront_discount"],
          CONFIG_FIELDS["duo.corider_base_discount"],
          CONFIG_FIELDS["duo.corider_max_fare_ratio"],
          CONFIG_FIELDS["duo.corider_overlap_bonus"],
          CONFIG_FIELDS["duo.driver_min_earning_protection"],
          CONFIG_FIELDS["duo.raut_subsidizes_unmatched"],
        ],
      },
      {
        id: "duo-matching",
        title: "Matching",
        description: "Limits applied when pairing a host with co-riders.",
        fields: [
          CONFIG_FIELDS["duo.max_coriders"],
          CONFIG_FIELDS["duo.search_radius_km"],
        ],
      },
      {
        id: "duo-availability",
        title: "Availability",
        description: "Turn the DUO product on or off for new requests.",
        fields: [CONFIG_FIELDS["feature.multiple_riders"]],
      },
    ],
  },
  {
    id: "private",
    label: "Private ride",
    description: "Fares, commission and surge for car and XL rides.",
    sections: [
      {
        id: "private-base",
        title: "Base fares",
        fields: [
          CONFIG_FIELDS["pricing.base_fare.car"],
          CONFIG_FIELDS["pricing.base_fare.xl"],
        ],
      },
      {
        id: "private-distance",
        title: "Distance rates",
        fields: [
          CONFIG_FIELDS["pricing.per_km_rate.car"],
          CONFIG_FIELDS["pricing.per_km_rate.xl"],
        ],
      },
      {
        id: "private-commission",
        title: "Commission",
        description: "Commission held on private rides.",
        fields: [
          CONFIG_FIELDS["pricing.commission_default"],
          CONFIG_FIELDS["commission.private_ride"],
        ],
      },
      {
        id: "private-rules",
        title: "Fare rules",
        description: "Applied after the fare is calculated.",
        fields: [
          CONFIG_FIELDS["pricing.min_fare"],
          CONFIG_FIELDS["pricing.rounding_increment"],
        ],
      },
      {
        id: "private-surge",
        title: "Surge",
        description: "Demand-based multipliers applied to private fares.",
        fields: [
          CONFIG_FIELDS["surge.peak_hours"],
          CONFIG_FIELDS["surge.peak_hours_multiplier"],
          CONFIG_FIELDS["surge.high_demand_threshold"],
          CONFIG_FIELDS["surge.high_demand_multiplier"],
          CONFIG_FIELDS["surge.very_high_demand_threshold"],
          CONFIG_FIELDS["surge.very_high_demand_multiplier"],
          CONFIG_FIELDS["surge.max_multiplier"],
        ],
      },
    ],
  },
  {
    id: "public",
    label: "Public ride",
    description: "Fares and commission for boda and bajaji rides.",
    sections: [
      {
        id: "public-base",
        title: "Base fares",
        fields: [
          CONFIG_FIELDS["pricing.base_fare.boda"],
          CONFIG_FIELDS["pricing.base_fare.bajaji"],
        ],
      },
      {
        id: "public-distance",
        title: "Distance rates",
        fields: [
          CONFIG_FIELDS["pricing.per_km_rate.boda"],
          CONFIG_FIELDS["pricing.per_km_rate.bajaji"],
        ],
      },
      {
        id: "public-commission",
        title: "Commission",
        fields: [CONFIG_FIELDS["commission.public_ride"]],
      },
    ],
  },
];

/** Feature-flags section shared by the config screens. */
export const FEATURE_SECTION: ConfigSectionSpec = {
  id: "features",
  title: "Feature flags",
  description:
    "Turn platform capabilities on or off. Changes apply to new requests after saving.",
  fields: [
    CONFIG_FIELDS["feature.multiple_riders"],
    CONFIG_FIELDS["feature.promo_codes"],
    CONFIG_FIELDS["feature.ratings"],
    CONFIG_FIELDS["feature.scheduled_routes"],
    CONFIG_FIELDS["feature.surge_pricing"],
  ],
};

/** Operations sections covering quoting limits and ride rules. */
export const OPERATIONS_SECTIONS: ConfigSectionSpec[] = [
  {
    id: "operations-quoting",
    title: "Quoting",
    description: "Limits applied while a fare quote is being prepared.",
    fields: [
      CONFIG_FIELDS["quote.expiry_seconds"],
      CONFIG_FIELDS["quote.join_expiry_seconds"],
      CONFIG_FIELDS["quote.recalculation_threshold_m"],
      CONFIG_FIELDS["quote.surge_revalidate_threshold_percent"],
    ],
  },
  {
    id: "operations-rides",
    title: "Ride rules",
    description: "Cancellation fees and waiting limits.",
    fields: [
      CONFIG_FIELDS["ride.after_accept_cancellation_fee_tzs"],
      CONFIG_FIELDS["ride.driver_late_free_cancel_threshold_minutes"],
      CONFIG_FIELDS["ride.max_free_waiting_minutes"],
      CONFIG_FIELDS["ride.max_join_walk_distance_m"],
      CONFIG_FIELDS["ride.no_show_cancellation_fee_tzs"],
      CONFIG_FIELDS["ride.waiting_charge_per_minute_tzs"],
    ],
  },
];

// Keys belonging to the public (boda/bajaji) pricing tab.
const PUBLIC_KEYS = new Set([
  "pricing.base_fare.boda",
  "pricing.base_fare.bajaji",
  "pricing.per_km_rate.boda",
  "pricing.per_km_rate.bajaji",
  "commission.public_ride",
]);

// DUO tab keys, derived from the first pricing tab's sections.
const DUO_KEYS = new Set([
  ...PRICING_TABS[0].sections.flatMap((section) =>
    section.fields.map((spec) => spec.key),
  ),
]);

// Private tab keys, derived from the second pricing tab's sections.
const PRIVATE_KEYS = new Set([
  ...PRICING_TABS[1].sections.flatMap((section) =>
    section.fields.map((spec) => spec.key),
  ),
]);

/**
 * Returns the pricing tab a config key belongs to, or null when it is not a
 * pricing key. Explicit key sets are checked first, then prefix heuristics.
 */
export function pricingTabForKey(key: string): PricingTabId | null {
  if (PUBLIC_KEYS.has(key)) return "public";
  if (DUO_KEYS.has(key)) return "duo";
  if (PRIVATE_KEYS.has(key)) return "private";
  if (key.startsWith("duo.") || key.startsWith("commission.duo_")) return "duo";
  if (key === "commission.public_ride") return "public";
  if (
    key.startsWith("pricing.") ||
    key.startsWith("surge.") ||
    key === "commission.private_ride"
  ) {
    return "private";
  }

  return null;
}

/** True when a record is a feature flag (by type or "feature." key). */
export const isFeatureConfig = (record: ConfigRecord) =>
  record.type === "feature_flag" || record.key.startsWith("feature.");

/** True when a record is a quoting or ride-rule config. */
export const isOperationsConfig = (record: ConfigRecord) =>
  record.key.startsWith("quote.") || record.key.startsWith("ride.");

/** True when a record belongs to one of the pricing tabs. */
export const isPricingConfig = (record: ConfigRecord) =>
  pricingTabForKey(record.key) !== null;

// Fallback spec inferred from the first value's runtime type.
const inferFieldSpec = (record: ConfigRecord): ConfigFieldSpec => {
  const sample = Object.values(record.value ?? {})[0];

  if (typeof sample === "boolean") {
    return {
      key: record.key,
      label: humanizeKey(record.key),
      type: "switch",
      valueKey: Object.keys(record.value ?? {})[0] ?? "enabled",
    };
  }

  if (typeof sample === "number") {
    return {
      key: record.key,
      label: humanizeKey(record.key),
      type: "number",
      valueKey: Object.keys(record.value ?? {})[0] ?? "value",
    };
  }

  return {
    key: record.key,
    label: humanizeKey(record.key),
    type: "text",
    valueKey: Object.keys(record.value ?? {})[0] ?? "value",
  };
};

/**
 * Turns a config key into a readable label.
 *
 * Uses the last dot-segment, drops "_tzs"/"_percent" suffixes and underscores,
 * and title-cases the result; returns "Setting" when nothing remains.
 */
export function humanizeKey(key: string) {
  const name = String(key ?? "")
    .split(".")
    .pop()
    ?.replace(/_tzs$/, "")
    .replace(/_percent$/, "")
    .replace(/_/g, " ")
    .trim();

  return name ? name.charAt(0).toUpperCase() + name.slice(1) : "Setting";
}

/** Returns the registered spec for a record, or an inferred fallback. */
export const fieldSpecFor = (record: ConfigRecord): ConfigFieldSpec =>
  CONFIG_FIELDS[record.key] ?? inferFieldSpec(record);

/**
 * Reads a field's value from a config value.
 *
 * Returns the value as-is when it is not an object, and undefined for null or
 * undefined input. For objects, tries the spec's valueKey, then "value", then
 * the object's own keys.
 */
export function readFieldValue(value: ConfigValue, spec: ConfigFieldSpec) {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== "object") return value;

  const candidates = [spec.valueKey, "value", ...Object.keys(value)].filter(
    (candidate): candidate is string => Boolean(candidate),
  );

  for (const candidate of candidates) {
    if (candidate in value) return value[candidate];
  }

  return undefined;
}

/**
 * Returns a copy of a config value object with the field set to `next`.
 *
 * Chooses the target property from the spec's valueKey, an existing "value"
 * property, or the sole existing key; defaults to "value". Non-object values
 * are replaced with a fresh object.
 */
export function writeFieldValue(
  value: ConfigValue,
  spec: ConfigFieldSpec,
  next: string | number | boolean,
): ConfigValue {
  const base =
    value && typeof value === "object" && !Array.isArray(value)
      ? { ...value }
      : {};
  const keys = Object.keys(base);

  let target = spec.valueKey ?? "value";

  if (spec.valueKey && spec.valueKey in base) {
    target = spec.valueKey;
  } else if ("value" in base) {
    target = "value";
  } else if (keys.length === 1) {
    target = keys[0];
  }

  base[target] = next;

  return base;
}

/** Converts a record's value to its draft form: boolean for switches, string otherwise. */
export function toDraftValue(record: ConfigRecord): string | boolean {
  const spec = fieldSpecFor(record);
  const raw = readFieldValue(record.value, spec);

  if (spec.type === "switch") return Boolean(raw);

  return raw === undefined || raw === null ? "" : String(raw);
}

/** Builds a draft map (config key to editable value) from the given records. */
export function buildConfigDraft(records: ConfigRecord[]): ConfigDraft {
  return records.reduce<ConfigDraft>((draft, record) => {
    draft[record.key] = toDraftValue(record);
    return draft;
  }, {});
}

/**
 * Diffs a draft against the records and returns the changed config updates.
 *
 * Unchanged, undefined or non-numeric number values are skipped; values are
 * coerced to match the field type before being written back.
 */
export function draftToUpdates(
  records: ConfigRecord[],
  draft: ConfigDraft,
): ConfigUpdate[] {
  const updates: ConfigUpdate[] = [];

  for (const record of records) {
    const spec = fieldSpecFor(record);
    const next = draft[record.key];

    if (next === undefined) continue;
    if (next === toDraftValue(record)) continue;

    const parsed =
      spec.type === "switch"
        ? Boolean(next)
        : spec.type === "number"
          ? Number(next)
          : String(next).trim();

    if (spec.type === "number" && !Number.isFinite(parsed)) continue;

    updates.push({
      key: record.key,
      value: writeFieldValue(
        record.value,
        spec,
        parsed as string | number | boolean,
      ),
    });
  }

  return updates;
}

/**
 * Validates number fields in a draft, returning errors keyed by config key.
 *
 * Checks required, finite, and min/max bounds; non-number fields are ignored.
 */
export function validateConfigDraft(
  records: ConfigRecord[],
  draft: ConfigDraft,
): FieldErrors {
  const errors: FieldErrors = {};

  for (const record of records) {
    const spec = fieldSpecFor(record);

    if (spec.type !== "number") continue;

    const raw = draft[record.key];
    const text = raw === undefined || raw === null ? "" : String(raw).trim();

    if (!text) {
      errors[record.key] = `${spec.label} is required`;
      continue;
    }

    const amount = Number(text);

    if (!Number.isFinite(amount)) {
      errors[record.key] = `${spec.label} must be a number`;
      continue;
    }

    if (spec.min !== undefined && amount < spec.min) {
      errors[record.key] = `${spec.label} must be at least ${spec.min}`;
      continue;
    }

    if (spec.max !== undefined && amount > spec.max) {
      errors[record.key] = `${spec.label} must be at most ${spec.max}`;
    }
  }

  return errors;
}

// Shared number formatter: at most two decimal places.
const numberFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

/**
 * Formats a config value for display according to its unit.
 *
 * Booleans become Enabled/Disabled, empty values become "—", and numbers are
 * rendered with unit suffixes (TZS, %, ×, min, s, km/m, or a plain count).
 */
export function formatConfigValue(
  value: string | number | boolean | null | undefined,
  spec: ConfigFieldSpec,
) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Enabled" : "Disabled";

  const amount = Number(value);

  if (!Number.isFinite(amount)) return String(value);

  switch (spec.unit) {
    case "money":
      return `TZS ${numberFormat.format(amount)}`;
    case "percent":
      return `${numberFormat.format(amount)}%`;
    case "multiplier":
      return `${numberFormat.format(amount)}×`;
    case "minutes":
      return `${numberFormat.format(amount)} min`;
    case "seconds":
      return `${numberFormat.format(amount)} s`;
    case "meters":
      return amount >= 1000
        ? `${numberFormat.format(amount / 1000)} km`
        : `${numberFormat.format(amount)} m`;
    case "km":
      return `${numberFormat.format(amount)} km`;
    case "count":
      return numberFormat.format(amount);
    default:
      return numberFormat.format(amount);
  }
}

/**
 * Filters sections to the fields present in `records` and appends any leftover
 * keys under an "Other settings" section. Sections with no fields are dropped.
 */
export function sectionsForRecords(
  sections: ConfigSectionSpec[],
  records: ConfigRecord[],
): ConfigSectionSpec[] {
  const available = new Set(records.map((record) => record.key));
  const covered = new Set<string>();

  const resolved = sections
    .map((section) => {
      const fields = section.fields.filter((spec) => available.has(spec.key));

      fields.forEach((spec) => covered.add(spec.key));

      return { ...section, fields };
    })
    .filter((section) => section.fields.length > 0);

  const extra = records.filter((record) => !covered.has(record.key));

  if (extra.length) {
    resolved.push({
      id: "other",
      title: "Other settings",
      description: "Additional configuration keys returned by the API.",
      fields: extra.map(fieldSpecFor),
    });
  }

  return resolved;
}
