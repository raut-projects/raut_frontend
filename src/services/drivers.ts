import { API_ROUTES } from "../lib/config";
import { apiGet } from "./api";
import { mapDriver } from "./mappers";

// Keep page requests small while scanning the complete fleet for local filters.
const FLEET_PAGE_SIZE = 100;

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
