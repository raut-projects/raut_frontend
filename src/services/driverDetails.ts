// Single-driver detail service.
// Loads one driver from /admin/drivers/:driverId and returns both the formatted
// row used by lists and the raw profile record, plus the documents, vehicles,
// stats and LATRA status bundled in that response. Failures surface as ApiError.

import { API_ROUTES } from "../lib/config";
import { ApiError } from "./http";
import { apiGet } from "./api";
import { mapDriver, mapDocument } from "./mappers";

/**
 * Loads a single driver with its full profile, documents and vehicles.
 * GET /admin/drivers/:driverId. Returns `{ ...mapDriver(profile), profile,
 * documents, vehicles, primaryVehicle, driveStats, payoutStats,
 * missingDocuments, allDocumentsVerified, canBeVerified, lastActivity, latra }`.
 * Throws ApiError (including 404 "Driver not found.") on failure.
 */
export async function getDriverDetails(
  driverId,
  { signal }: { signal?: AbortSignal } = {},
) {
  const data = await apiGet(API_ROUTES.driverDetail(driverId), { signal });
  const payload = data?.data ?? data ?? {};
  const profile = payload?.profile ?? payload?.driver ?? payload;
  const asRecord = (value) =>
    value && typeof value === "object" && !Array.isArray(value) ? value : null;
  const latraSource =
    asRecord(payload?.latra) ?? asRecord(payload?.latra_status) ?? {};

  const vehicles = Array.isArray(payload?.vehicles) ? payload.vehicles : [];
  const firstVehicle = vehicles[0] ?? null;
  const documents = Array.isArray(payload?.documents)
    ? payload.documents.map(mapDocument)
    : [];
  const driveStats = asRecord(payload?.drive_stats ?? payload?.driveStats);
  const payoutStats = asRecord(payload?.payout_stats ?? payload?.payoutStats);

  return {
    ...mapDriver({
      ...profile,
      vehicle: firstVehicle ?? profile?.vehicle,
      total_drives:
        driveStats?.total_drives ?? profile?.total_drives ?? undefined,
      profile_photo_url:
        profile?.profile_photo_url ?? payload?.profile_photo_url ?? undefined,
    }),
    profile,
    documents,
    vehicles,
    primaryVehicle: firstVehicle,
    driveStats,
    payoutStats,
    missingDocuments:
      payload?.missing_documents ?? payload?.missingDocuments ?? [],
    allDocumentsVerified:
      payload?.all_documents_verified ?? payload?.allDocumentsVerified ?? null,
    canBeVerified: payload?.can_be_verified ?? payload?.canBeVerified ?? null,
    lastActivity: payload?.last_activity ?? payload?.lastActivity ?? null,
    latra: {
      submitted:
        payload?.latra_submitted ??
        latraSource.submitted ??
        latraSource.is_submitted ??
        null,
      submittedAt:
        payload?.latra_submitted_at ?? latraSource.submitted_at ?? null,
      submissionStatus:
        payload?.latra_submission_status ??
        latraSource.submission_status ??
        latraSource.status ??
        null,
      referenceNumber:
        payload?.latra_reference_number ?? latraSource.reference_number ?? null,
      errorMessage:
        payload?.latra_error_message ?? latraSource.error_message ?? null,
    },
  };
}
