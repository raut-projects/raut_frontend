import { API_ROUTES } from "../lib/config";
import type {
  ConfigHistoryResponse,
  FeatureFlags,
  Integration,
  IntegrationTestResult,
  OperationsConfig,
  PricingConfig,
} from "../types/platformConfig";
import { apiGet, apiPost, apiPut } from "./api";
import {
  mapConfigHistory,
  mapFeatureFlags,
  mapIntegration,
  mapIntegrationTestResult,
  mapOperationsConfig,
  mapPricingConfig,
} from "./mappers";

export async function getPricingConfig(): Promise<PricingConfig> {
  return mapPricingConfig(await apiGet(API_ROUTES.configPricing));
}

export async function updatePricingConfig(payload: PricingConfig) {
  await apiPut(API_ROUTES.configPricing, payload);
}

export async function getFeatureFlags(): Promise<FeatureFlags> {
  return mapFeatureFlags(await apiGet(API_ROUTES.configFeatures));
}

export async function updateFeatureFlags(payload: FeatureFlags) {
  await apiPut(API_ROUTES.configFeatures, payload);
}

export async function getOperationsConfig(): Promise<OperationsConfig> {
  return mapOperationsConfig(await apiGet(API_ROUTES.configOperations));
}

export async function updateOperationsConfig(payload: OperationsConfig) {
  await apiPut(API_ROUTES.configOperations, payload);
}

export async function listIntegrations(): Promise<Integration[]> {
  const data = await apiGet(API_ROUTES.configIntegrations);

  if (!Array.isArray(data)) return [];

  return data.map(mapIntegration);
}

export async function testIntegration(
  service: string,
): Promise<IntegrationTestResult> {
  return mapIntegrationTestResult(
    await apiPost(API_ROUTES.configIntegrationTest(service), {}),
  );
}

export async function listConfigHistory({
  page = 1,
  limit = 5,
}: {
  page?: number;
  limit?: number;
} = {}): Promise<ConfigHistoryResponse> {
  return mapConfigHistory(
    await apiGet(API_ROUTES.configHistory, {
      params: { page, limit },
    }),
  );
}
