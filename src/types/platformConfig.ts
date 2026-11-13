/**
 * Platform configuration models for the admin config screen: versioned
 * key/value settings scoped by region and vehicle type. Null scope fields mean
 * global.
 */

/** Scalar configuration payload; values are JSON-compatible primitives. */
export type ConfigValue = Record<string, string | number | boolean | null>;

/**
 * Full backend configuration record. `version` increments on every update,
 * `region`/`vehicleType` are null for global scope, and the `activeFrom` /
 * `activeUntil` / `updatedAt` dates are nullable ISO strings.
 */
export type ConfigRecord = {
  id: string;
  key: string;
  value: ConfigValue;
  type: string;
  description: string;
  region: string | null;
  vehicleType: string | null;
  version: number;
  activeFrom: string | null;
  activeUntil: string | null;
  updatedAt: string | null;
  notes: string | null;
};

/** Compact key/value view of a configuration with its scope. */
export type ConfigDetail = {
  key: string;
  value: ConfigValue;
  region: string | null;
  vehicleType: string | null;
};

/** Query parameters for listing configs (backend uses snake_case). */
export type ConfigListFilters = {
  config_type?: string;
  region?: string;
  vehicle_type?: string;
};

/** Scope selector; null/undefined region or vehicle type means all scopes. */
export type ConfigScope = {
  region?: string | null;
  vehicle_type?: string | null;
};

/** Update payload for a single configuration key. */
export type ConfigUpdate = {
  key: string;
  value: ConfigValue;
};

/**
 * One entry in a configuration's version history. `previousVersionId` is null
 * for the first version; `changedAt` and `changedBy` are null when the backend
 * did not record an author timestamp.
 */
export type ConfigHistoryEntry = {
  id: string;
  version: number;
  previousVersionId: string | null;
  value: ConfigValue;
  changedAt: string | null;
  changedBy: string | null;
  notes: string | null;
};

// Kept for the marketing promotion form, which only needs to know whether the
// DUO / multiple-riders capability is enabled.
export type FeatureFlags = {
  scheduled_rides: boolean;
  duo: boolean;
  ratings: boolean;
  in_app_chat: boolean;
  corporate_accounts: boolean;
};

/** Form validation errors keyed by field name. */
export type FieldErrors = Record<string, string>;

/** Fare breakdown; amounts are in TZS and `total` is the charged fare. */
export type FareBreakdown = {
  base: number;
  distance: number;
  time: number;
  subtotal: number;
  surge: number;
  total: number;
};
