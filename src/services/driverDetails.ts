import { API_ROUTES } from "../lib/config";
import { ApiError } from "./http";
import { apiGet } from "./api";
import { mapDriver } from "./mappers";

const isRecord = (value) => value !== null && typeof value === "object";

const getDriverRecord = (payload, driverId) => {
  const candidate = payload?.driver ?? payload?.item ?? payload;
  const records = Array.isArray(candidate) ? candidate : [candidate];

  return records.find(
    (record) => isRecord(record) && String(record.id) === String(driverId),
  );
};

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
