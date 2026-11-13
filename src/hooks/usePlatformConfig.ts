import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../lib/queryKeys";
import {
  getConfig,
  getConfigHistory,
  listConfigs,
  updateConfigs,
} from "../services/platformConfig";
import type {
  ConfigListFilters,
  ConfigScope,
  ConfigUpdate,
  FeatureFlags,
} from "../types/platformConfig";

const configQueryOptions = {
  staleTime: 60_000,
  refetchOnWindowFocus: false,
};

export function useConfigs(filters: ConfigListFilters = {}) {
  return useQuery({
    queryKey: queryKeys.config.list(filters),
    queryFn: () => listConfigs(filters),
    ...configQueryOptions,
  });
}

export function useConfig(configKey: string | null, scope: ConfigScope = {}) {
  return useQuery({
    queryKey: queryKeys.config.detail(configKey, scope),
    queryFn: () => getConfig(configKey as string, scope),
    enabled: Boolean(configKey),
    ...configQueryOptions,
  });
}

export function useConfigHistory(configKey: string | null, limit = 50) {
  return useQuery({
    queryKey: queryKeys.config.history(configKey, limit),
    queryFn: () => getConfigHistory(configKey as string, limit),
    enabled: Boolean(configKey),
    ...configQueryOptions,
  });
}

export function useUpdateConfigs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: ConfigUpdate[]) => updateConfigs(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.config.all });
    },
  });
}

const isEnabled = (
  configs: { key: string; value: Record<string, unknown> }[],
  key: string,
) => Boolean(configs.find((config) => config.key === key)?.value?.enabled);

// Compatibility wrapper for screens (marketing promotions) that only need to
// know whether a capability is switched on.
export function useFeatureFlags() {
  return useQuery({
    queryKey: queryKeys.config.list({ config_type: "feature_flag" }),
    queryFn: () => listConfigs({ config_type: "feature_flag" }),
    select: (configs): FeatureFlags => ({
      scheduled_rides: isEnabled(configs, "feature.scheduled_routes"),
      duo:
        isEnabled(configs, "feature.multiple_riders") ||
        isEnabled(configs, "feature.duo"),
      ratings: isEnabled(configs, "feature.ratings"),
      in_app_chat: isEnabled(configs, "feature.in_app_chat"),
      corporate_accounts: isEnabled(configs, "feature.corporate_accounts"),
    }),
    ...configQueryOptions,
  });
}
