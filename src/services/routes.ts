// Route listing and summary service.
// Lists scheduled routes with filters and derives summary counts from
// pagination totals. All calls go through `./api`, so failures reject with ApiError.

import { API_ROUTES } from "../lib/config";
import { apiGet } from "./api";
import { mapRoute } from "./mappers";

const SUMMARY_STATUSES = ["active", "completed", "cancelled"];

const countRoutes = async (
  status?: string,
  { signal }: { signal?: AbortSignal } = {},
) => {
  const params: Record<string, string | number> = { page: 1, page_size: 1 };

  if (status) params.status = status;

  const data = await apiGet(API_ROUTES.routes, { params, signal });

  return data?.pagination?.total_items ?? 0;
};

export async function listRoutes({
  status = "all",
  driverId = "",
  origin = "",
  destination = "",
  from = "",
  to = "",
  page = 1,
  limit = 10,
} = {}, { signal }: { signal?: AbortSignal } = {}) {
  const params: Record<string, string | number> = {
    page,
    page_size: limit,
    sort_by: "created_at",
    sort_order: "desc",
  };

  if (status && status !== "all") params.status = String(status).toLowerCase();
  if (driverId) params.driver_id = driverId;
  if (origin) params.origin = origin;
  if (destination) params.destination = destination;
  if (from) params.start_date = from;
  if (to) params.end_date = to;

  const data = await apiGet(API_ROUTES.routes, { params, signal });
  const items = (data?.items ?? []).map(mapRoute);

  return {
    items,
    total: data?.pagination?.total_items ?? items.length,
    page,
    limit,
  };
}

export async function getRouteSummary({
  signal,
}: { signal?: AbortSignal } = {}) {
  const [total, active, completed, cancelled] = await Promise.all([
    countRoutes(undefined, { signal }),
    ...SUMMARY_STATUSES.map((status) => countRoutes(status, { signal })),
  ]);

  return { total, active, completed, cancelled };
}
