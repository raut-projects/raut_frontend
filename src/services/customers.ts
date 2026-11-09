import { API_ROUTES } from "../lib/config";
import { apiGet } from "./api";
import { mapCustomer } from "./mappers";

const CUSTOMER_STATS_PAGE_SIZE = 100;

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
      if (totalItems !== null && loadedItems < totalItems) {
        throw new Error("Could not load all customer records for statistics.");
      }
      break;
    }
    if (totalItems === null && pageItems.length < CUSTOMER_STATS_PAGE_SIZE) {
      break;
    }
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
