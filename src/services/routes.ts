import { API_ROUTES } from "../lib/config";
import { apiGet } from "./api";
import { mapRoute } from "./mappers";

const SUMMARY_STATUSES = ["active", "completed", "cancelled"];

const countRoutes = async (status?: string) => {
  const params: Record<string, string | number> = { page: 1, page_size: 1 };

  if (status) params.status = status;

  const data = await apiGet(API_ROUTES.routes, { params });

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
} = {}) {
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

  const data = await apiGet(API_ROUTES.routes, { params });
  const items = (data?.items ?? []).map(mapRoute);

  return {
    items,
    total: data?.pagination?.total_items ?? items.length,
    page,
    limit,
  };
}

export async function getRouteSummary() {
  const [total, active, completed, cancelled] = await Promise.all([
    countRoutes(),
    ...SUMMARY_STATUSES.map(countRoutes),
  ]);

  return { total, active, completed, cancelled };
}
