import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { queryKeys } from "../lib/queryKeys";
import {
  getFeatureFlags,
  getOperationsConfig,
  getPricingConfig,
  listConfigHistory,
  listIntegrations,
  testIntegration,
  updateFeatureFlags,
  updateOperationsConfig,
  updatePricingConfig,
} from "../services/platformConfig";

const configQueryOptions = {
  staleTime: 60_000,
  refetchOnWindowFocus: false,
};

export function usePricingConfig() {
  return useQuery({
    queryKey: queryKeys.config.pricing,
    queryFn: getPricingConfig,
    ...configQueryOptions,
  });
}

export function useFeatureFlags() {
  return useQuery({
    queryKey: queryKeys.config.features,
    queryFn: getFeatureFlags,
    ...configQueryOptions,
  });
}

export function useOperationsConfig() {
  return useQuery({
    queryKey: queryKeys.config.operations,
    queryFn: getOperationsConfig,
    ...configQueryOptions,
  });
}

export function useIntegrations() {
  return useQuery({
    queryKey: queryKeys.config.integrations,
    queryFn: listIntegrations,
    ...configQueryOptions,
  });
}

export function useConfigHistory(params: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.config.history(params),
    queryFn: () => listConfigHistory(params),
    placeholderData: keepPreviousData,
    ...configQueryOptions,
  });
}

export function useUpdatePricingConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePricingConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.config.all });
    },
  });
}

export function useUpdateFeatureFlags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateFeatureFlags,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.config.all });
    },
  });
}

export function useUpdateOperationsConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOperationsConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.config.all });
    },
  });
}

export function useTestIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: testIntegration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.config.all });
    },
  });
}
