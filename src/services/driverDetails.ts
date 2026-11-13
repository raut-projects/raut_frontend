// Single-driver detail service.
// Loads one driver and returns both the formatted row used by lists and the raw
// profile record. Because some backends only expose drivers as a collection,
// the direct lookup falls back to search and then to scanning the first fleet
// page. Failures surface as ApiError.

import { API_ROUTES } from "../lib/config";
import { ApiError } from "./http";
import { apiGet } from "./api";
import { mapDriver } from "./mappers";

const isRecord = (value) => value !== null && typeof value === "object";

// Accepts a single object, an array, or objects nested under `driver`/`item`,
// and selects the record whose id matches the requested driver.
const getDriverRecord = (payload, driverId) => {
  const candidate = payload?.driver ?? payload?.item ?? payload;
  const records = Array.isArray(candidate) ? candidate : [candidate];

  return records.find(
    (record) => isRecord(record) && String(record.id) === String(driverId),
  );
};

/**
 * Loads a single driver with its full profile.
 * Tries GET /drivers/:driverId first. On a 404 it searches GET /drivers by the
 * id, then scans the first 100 fleet rows, matching on `id`.
 * Returns `{ ...mapDriver(record), profile }`, where `profile` is the raw record.
 * Throws ApiError(404) when none of the lookups find the driver; other ApiErrors
 * are rethrown unchanged.
 */
export async function getDriverDetails(driverId) {
  try {
    const data = await apiGet(
      `${API_ROUTES.drivers}/${encodeURIComponent(driverId)}`,
    );
    const record = getDriverRecord(data, driverId);

    if (!record) {
      throw new ApiError("Driver not found.", 404);
    }

    return { ...mapDriver(record), profile: record };
  } catch (error) {
    // Only a 404 is worth a fallback; auth, network, and server errors should
    // reach the caller unchanged.
    if (!(error instanceof ApiError) || error.status !== 404) {
      throw error;
    }

    const searchResult = await apiGet(API_ROUTES.drivers, {
      params: {
        search: driverId,
        page: 1,
        page_size: 100,
        sort_by: "total_rides",
        sort_order: "desc",
      },
    });
    const searchedDriver = getDriverRecord(
      searchResult?.items ?? searchResult?.drivers ?? searchResult,
      driverId,
    );

    if (searchedDriver) {
      return { ...mapDriver(searchedDriver), profile: searchedDriver };
    }

    const result = await apiGet(API_ROUTES.drivers, {
      params: {
        page: 1,
        page_size: 100,
        sort_by: "total_rides",
        sort_order: "desc",
      },
    });
    const driver = getDriverRecord(
      result?.items ?? result?.drivers ?? result,
      driverId,
    );

    if (!driver) throw new ApiError("Driver not found.", 404);

    return { ...mapDriver(driver), profile: driver };
  }
}
