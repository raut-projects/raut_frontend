// Transaction listing and summary service.
// Lists financial transactions with filters and derives summary counts from
// pagination totals. All calls go through `./api`, so failures reject with ApiError.

import { API_ROUTES } from "../lib/config";
import { apiGet } from "./api";
import { mapTransaction } from "./mappers";

const countTransactions = async (
  status = "all",
  { signal }: { signal?: AbortSignal } = {},
) => {
  const params: Record<string, string | number> = { page: 1, page_size: 1 };

  if (status && status !== "all") params.status = status;

  const data = await apiGet(API_ROUTES.transactions, { params, signal });

  return data?.pagination?.total_items ?? 0;
};

const asTransactionList = (payload) => {
  if (Array.isArray(payload)) return payload;

  return payload?.items ?? payload?.transactions ?? payload?.results ?? [];
};

export async function listTransactions({
  status = "all",
  type = "all",
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
  if (type && type !== "all") params.type = String(type).toLowerCase();
  if (from) params.start_date = from;
  if (to) params.end_date = to;

  const data = await apiGet(API_ROUTES.transactions, { params, signal });
  const items = asTransactionList(data).map(mapTransaction);

  return {
    items,
    total: data?.pagination?.total_items ?? items.length,
    page,
    limit,
  };
}

export async function getTransactionSummary({
  signal,
}: { signal?: AbortSignal } = {}) {
  const [total, pending, completed, failed] = await Promise.all([
    countTransactions(undefined, { signal }),
    countTransactions("pending", { signal }),
    countTransactions("completed", { signal }),
    countTransactions("failed", { signal }),
  ]);

  return { total, pending, completed, failed };
}
