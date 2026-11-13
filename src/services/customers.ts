// Customer directory service.
// Lists rider accounts and derives active/inactive statistics from the users
// endpoint. Filtering is sent server-side where possible; the stats helper pages
// through every record and counts locally. Failures surface as ApiError from
// `./api`.

import { API_ROUTES } from "../lib/config";
import { apiGet } from "./api";
import { mapCustomer } from "./mappers";

// The stats pass needs every customer, so it uses the largest page size the
// backend accepts to keep the request count low.
const CUSTOMER_STATS_PAGE_SIZE = 100;

/**
 * Lists customer accounts (users without a driver profile).
 * GET /users with pagination, optional `search`, and `is_active` derived from
 * the `status` filter ("active"/"inactive"; other values are ignored).
 * Returns `{ items, total, page, limit }`, with `total` falling back to the
 * page length when pagination is missing. Throws ApiError on failure.
 */
export async function listCustomers({
  search = "",
  status = "all",
  page = 1,
  limit = 8,
} = {}) {
  const query = String(search ?? "").trim();

  const params: Record<string, string | number | boolean> = {
    page,
    page_size: limit,
    is_driver: false,
    sort_by: "created_at",
    sort_order: "desc",
  };

  if (query) params.search = query;
  const state = String(status).toLowerCase();
  // Only the two explicit states map to a boolean flag; "all" stays unfiltered.
  if (state === "active") params.is_active = true;
  if (state === "inactive") params.is_active = false;

  const data = await apiGet(API_ROUTES.users, { params });
  const items = (data?.items ?? []).map(mapCustomer);

  return {
    items,
    total: data?.pagination?.total_items ?? items.length,
    page,
    limit,
  };
}

/**
 * Counts every customer as active or inactive.
 * Pages through GET /users with `is_driver: false` (100 per page) until the
 * reported total is loaded, then counts `is_active !== false` as active.
 * Returns `{ total, active, inactive }`.
 * Throws ApiError on request failure, and a plain Error when the backend reports
 * a total that cannot be reached or the page guard trips.
 */
export async function getCustomerStats() {
  let page = 1;
  let totalItems: number | null = null;
  let active = 0;
  let inactive = 0;
  let loadedItems = 0;

  while (totalItems === null || loadedItems < totalItems) {
    const data = await apiGet(API_ROUTES.users, {
      params: {
        page,
        page_size: CUSTOMER_STATS_PAGE_SIZE,
        is_driver: false,
        sort_by: "created_at",
        sort_order: "desc",
      },
    });
    const pageItems = Array.isArray(data?.items) ? data.items : [];
    const reportedTotal = data?.pagination?.total_items;

    if (
      reportedTotal !== null &&
      reportedTotal !== undefined &&
      Number.isFinite(Number(reportedTotal))
    ) {
      totalItems = Number(reportedTotal);
    }

    pageItems.forEach((customer) => {
      if (customer?.is_active === false) inactive += 1;
      else active += 1;
    });
    loadedItems += pageItems.length;

    if (pageItems.length === 0) {
      // An empty page before the advertised total means the listing is
      // inconsistent; fail rather than report a partial statistic.
      if (totalItems !== null && loadedItems < totalItems) {
        throw new Error("Could not load all customer records for statistics.");
      }
      break;
    }
    // Without a reported total, a short page is the only end-of-list signal.
    if (totalItems === null && pageItems.length < CUSTOMER_STATS_PAGE_SIZE) {
      break;
    }
    // Guard against a backend that keeps returning full pages forever.
    if (page > 10_000) {
      throw new Error("Could not finish loading customer statistics.");
    }

    page += 1;
  }

  if (totalItems !== null && loadedItems < totalItems) {
    throw new Error("Could not load all customer records for statistics.");
  }

  return {
    total: totalItems ?? loadedItems,
    active,
    inactive,
  };
}
