// Single-driver detail service.
// Loads one driver from /admin/drives/:driverId and returns both the formatted
// row used by lists and the raw profile record, plus the documents, vehicles
// and stats bundled in that response. Failures surface as ApiError.

import { API_ROUTES } from "../lib/config";
import { ApiError } from "./http";
import { apiGet } from "./api";
import { mapDriver, mapDocument } from "./mappers";

/**
 * Loads a single driver with its full profile, documents and vehicles.
 * GET /admin/drives/:driverId. Returns `{ ...mapDriver(profile), profile,
 * documents, vehicles, driveStats, payoutStats, missingDocuments,
 * allDocumentsVerified, canBeVerified, lastActivity }`.
 * Throws ApiError (including 404 "Driver not found.") on failure.
 */
export async function getDriverDetails(driverId) {
  const data = await apiGet(API_ROUTES.driverDetail(driverId));
  const payload = data?.data ?? data ?? {};
  const profile = payload?.profile ?? payload?.driver ?? payload;

  const vehicles = Array.isArray(payload?.vehicles) ? payload.vehicles : [];
  const documents = Array.isArray(payload?.documents)
    ? payload.documents.map(mapDocument)
    : [];

  return {
    ...mapDriver({ ...profile, vehicle: vehicles[0] ?? profile?.vehicle }),
    profile,
    documents,
    vehicles,
    driveStats: payload?.drive_stats ?? payload?.driveStats ?? null,
    payoutStats: payload?.payout_stats ?? payload?.payoutStats ?? null,
    missingDocuments:
      payload?.missing_documents ?? payload?.missingDocuments ?? [],
    allDocumentsVerified:
      payload?.all_documents_verified ?? payload?.allDocumentsVerified ?? null,
    canBeVerified: payload?.can_be_verified ?? payload?.canBeVerified ?? null,
    lastActivity: payload?.last_activity ?? payload?.lastActivity ?? null,
  };
}
