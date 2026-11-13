export type ConfigValue = Record<string, string | number | boolean | null>;

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

export type ConfigDetail = {
  key: string;
  value: ConfigValue;
  region: string | null;
  vehicleType: string | null;
};

export type ConfigListFilters = {
  config_type?: string;
  region?: string;
  vehicle_type?: string;
};

export type ConfigScope = {
  region?: string | null;
  vehicle_type?: string | null;
};

export type ConfigUpdate = {
  key: string;
  value: ConfigValue;
};

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

export type FieldErrors = Record<string, string>;

export type FareBreakdown = {
  base: number;
  distance: number;
  time: number;
  subtotal: number;
  surge: number;
  total: number;
};
