import { API_ROUTES } from "../lib/config";
import type {
  ConfigDetail,
  ConfigHistoryEntry,
  ConfigListFilters,
  ConfigRecord,
  ConfigScope,
  ConfigUpdate,
  ConfigValue,
} from "../types/platformConfig";
import { apiGet, apiPut } from "./api";
import { mapConfigDetail, mapConfigHistory, mapConfigRecord } from "./mappers";

export async function listConfigs(
  filters: ConfigListFilters = {},
): Promise<ConfigRecord[]> {
  const data = await apiGet(API_ROUTES.configs, { params: filters });
  const configs = Array.isArray(data?.configs)
    ? data.configs
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data)
        ? data
        : [];

  return configs.map(mapConfigRecord).filter((config) => Boolean(config.key));
}

export async function getConfig(
  configKey: string,
  scope: ConfigScope = {},
): Promise<ConfigDetail> {
  return mapConfigDetail(
    await apiGet(API_ROUTES.config(configKey), { params: scope }),
  );
}

export async function updateConfig(
  configKey: string,
  value: ConfigValue,
): Promise<void> {
  await apiPut(API_ROUTES.config(configKey), { value });
}

export type ConfigUpdateFailure = {
  key: string;
  error: unknown;
};

export async function updateConfigs(
  updates: ConfigUpdate[],
): Promise<ConfigUpdateFailure[]> {
  const results = await Promise.allSettled(
    updates.map((update) => updateConfig(update.key, update.value)),
  );

  return results.flatMap((result, index) =>
    result.status === "rejected"
      ? [{ key: updates[index].key, error: result.reason }]
      : [],
  );
}

export async function getConfigHistory(
  configKey: string,
  limit = 50,
): Promise<ConfigHistoryEntry[]> {
  return mapConfigHistory(
    await apiGet(API_ROUTES.configHistory(configKey), {
      params: { limit },
    }),
  );
}
