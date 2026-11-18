// Driver directory service.
// Provides the full fleet (paged through for client-side filtering) and a
// filtered page plus fleet-wide summary counts for the drivers table. All data
// is normalised through `mapDriver`; request failures surface as ApiError.

import { API_ROUTES } from "../lib/config";
import { apiGet } from "./api";
import { mapDriver } from "./mappers";

// Keep page requests small while scanning the complete fleet for local filters.
const FLEET_PAGE_SIZE = 100;

/**
 * Loads every driver in the fleet.
 * Pages GET /drivers with a 100-row page, sorted by total rides, until the
 * reported total is reached (or the backend stops returning rows).
 * Returns `{ items, total, summary }`, where `summary` counts verified, pending
 * and incomplete drivers from the loaded rows.
 * Throws ApiError on request failure, or a plain Error when the page guard
 * trips. `total` prefers the server-reported count.
 */
export async function listAllDrivers() {
  const items = [];
  let page = 1;
  let totalItems = null;

  while (totalItems === null || items.length < totalItems) {
    const data = await apiGet(API_ROUTES.drivers, {
      params: {
        page,
        page_size: FLEET_PAGE_SIZE,
        sort_by: "total_rides",
        sort_order: "desc",
      },
    });
    const pageItems = data?.items ?? [];
    items.push(...pageItems);

    const reportedTotal = Number(data?.pagination?.total_items);
    if (Number.isFinite(reportedTotal)) totalItems = reportedTotal;

    if (pageItems.length === 0) break;
    // Without a server total, a short page marks the end of the collection.
    if (totalItems === null && pageItems.length < FLEET_PAGE_SIZE) break;
    if (page > 10_000) {
      throw new Error("Could not finish loading the driver list.");
    }

    page += 1;
  }

  const drivers = items.map(mapDriver);
  return {
    items: drivers,
    total: totalItems ?? drivers.length,
    summary: {
      total: totalItems ?? drivers.length,
      verified: drivers.filter((driver) => driver.statusKey === "verified")
        .length,
      pending: drivers.filter((driver) => driver.statusKey === "pending")
        .length,
      incomplete: drivers.filter((driver) => driver.statusKey === "incomplete")
        .length,
    },
  };
}

/**
 * Lists one page of drivers plus summary counts for the whole fleet.
 * Runs two GET /drivers requests in parallel: the requested page (with optional
 * `search` and `driver_status`) and a 100-row fleet sample used only for the
 * summary, so the summary is capped at that page size.
 * Returns `{ items, total, page, limit, summary }`.
 * Throws ApiError if either request fails.
 */
export async function listDrivers({
  search = "",
  status = "all",
  page = 1,
  limit = 8,
} = {}) {
  const query = String(search ?? "").trim();

  const params: Record<string, string | number> = {
    page,
    page_size: limit,
    sort_by: "total_rides",
    sort_order: "desc",
  };

  if (query) params.search = query;
  if (status && status !== "all")
    params.driver_status = String(status).toLowerCase();

  const [data, fleet] = await Promise.all([
    apiGet(API_ROUTES.drivers, { params }),
    apiGet(API_ROUTES.drivers, {
      params: {
        page: 1,
        page_size: FLEET_PAGE_SIZE,
        sort_by: "total_rides",
        sort_order: "desc",
      },
    }),
  ]);

  const items = (data?.items ?? []).map(mapDriver);
  const fleetItems = (fleet?.items ?? []).map(mapDriver);

  const summary = {
    total: fleet?.pagination?.total_items ?? fleetItems.length,
    verified: fleetItems.filter((driver) => driver.statusKey === "verified")
      .length,
    pending: fleetItems.filter((driver) => driver.statusKey === "pending")
      .length,
    incomplete: fleetItems.filter((driver) => driver.statusKey === "incomplete")
      .length,
  };

  return {
    items,
    total: data?.pagination?.total_items ?? items.length,
    page,
    limit,
    summary,
  };
}
