import { API_ROUTES } from "../lib/config";
import { apiGet, apiPut } from "./api";
import { mapPayout } from "./mappers";

// The summary cards read the whole book of payouts, the table reads the
// filtered page. The count is capped by the overview size, like the fleet
// summary on the drivers page.
const PAYOUT_OVERVIEW_SIZE = 100;
const PAYOUT_REVIEW_PAGE_SIZE = 100;

// The admin payout list has no declared response model, so the payload is read
// defensively: the rows may sit under `items`, under `payouts`, or be the
// array itself.
const asPayoutList = (payload) => {
  if (Array.isArray(payload)) return payload;

  return payload?.items ?? payload?.payouts ?? payload?.results ?? [];
};

const sumAmounts = (payouts) =>
  payouts.reduce((total, payout) => total + payout.amount, 0);

async function listAllPayoutsByStatus(status) {
  const payouts = [];
  let page = 1;
  let totalItems = null;

  while (totalItems === null || payouts.length < totalItems) {
    const data = await apiGet(API_ROUTES.payouts, {
      params: {
        status,
        page,
        page_size: PAYOUT_REVIEW_PAGE_SIZE,
        sort_by: "created_at",
        sort_order: "desc",
      },
    });
    const items = asPayoutList(data);
    payouts.push(...items);

    const reportedTotal = Number(data?.pagination?.total_items);
    if (Number.isFinite(reportedTotal)) totalItems = reportedTotal;

    if (
      totalItems === null &&
      items.length < PAYOUT_REVIEW_PAGE_SIZE
    ) {
      break;
    }

    if (items.length === 0) break;

    page += 1;
    if (page > 10_000) {
      throw new Error(`Could not finish loading ${status} payouts.`);
    }
  }

  return payouts.map(mapPayout);
}

const uniquePayouts = (payouts) => {
  const unique = new Map();

  payouts.forEach((payout) => {
    const key =
      payout.id === null || payout.id === undefined
        ? `${payout.driverId}:${payout.requestedAt}:${payout.amount}`
        : String(payout.id);
    unique.set(key, payout);
  });

  return [...unique.values()];
};

export async function listPendingPayoutBatch() {
  const [pending, requested] = await Promise.all([
    listAllPayoutsByStatus("pending"),
    listAllPayoutsByStatus("requested"),
  ]);
  const uniquePending = new Map();

  [...pending, ...requested].forEach((payout) => {
    if (!payout.canApprove || !["pending", "requested"].includes(payout.statusKey)) {
      return;
    }

    const payoutKey =
      payout.id === null || payout.id === undefined
        ? `${payout.driverId}:${payout.requestedAt}:${payout.amount}`
        : String(payout.id);
    uniquePending.set(payoutKey, payout);
  });

  return [...uniquePending.values()].sort((left, right) =>
    String(right.requestedAt).localeCompare(String(left.requestedAt)),
  );
}

export async function listPayoutBatchProcessing() {
  const [processing, approved] = await Promise.all([
    listAllPayoutsByStatus("processing"),
    listAllPayoutsByStatus("approved"),
  ]);

  return uniquePayouts(
    [...processing, ...approved].filter((payout) =>
      ["processing", "approved"].includes(payout.statusKey),
    ),
  );
}

export async function getPayoutFailureCounts() {
  const [failed, errors, reversed] = await Promise.all([
    listAllPayoutsByStatus("failed"),
    listAllPayoutsByStatus("error"),
    listAllPayoutsByStatus("reversed"),
  ]);
  const failedPayouts = [...failed, ...errors, ...reversed];
  const failuresByDriver = new Map();

  failedPayouts.forEach((payout) => {
    if (payout.driverId === null || payout.driverId === undefined) return;

    const driverKey = String(payout.driverId);
    failuresByDriver.set(
      driverKey,
      (failuresByDriver.get(driverKey) ?? 0) + 1,
    );
  });

  return Object.fromEntries(failuresByDriver);
}

export function withPayoutReviewIssues(payout, failuresByDriver) {
  const previousFailureCount = Math.max(
    payout.previousFailureCount,
    failuresByDriver[String(payout.driverId)] ?? 0,
  );

  return {
    ...payout,
    previousFailureCount,
    issues: [
      ...(payout.phoneVerified === false
        ? ["Phone number is not verified"]
        : payout.phoneVerified === null
          ? ["Phone verification status is unavailable"]
          : []),
      ...(payout.driverId === null || payout.driverId === undefined
        ? ["Driver ID is unavailable, so previous failures cannot be checked"]
        : []),
      ...(payout.amount <= 0 ? ["Payout amount is missing or invalid"] : []),
      ...(previousFailureCount > 0
        ? [
            `${previousFailureCount} previous payout failure${previousFailureCount === 1 ? "" : "s"}`,
          ]
        : []),
    ],
  };
}

export async function listPayouts({
  status = "all",
  method = "all",
  driverId = "",
  from = "",
  to = "",
  page = 1,
  limit = 8,
} = {}) {
  const params: Record<string, string | number> = {
    page,
    page_size: limit,
    sort_by: "created_at",
    sort_order: "desc",
  };

  if (status && status !== "all") params.status = String(status).toLowerCase();
  if (method && method !== "all") params.method = String(method).toLowerCase();
  if (driverId) params.driver_id = driverId;
  if (from) params.start_date = from;
  if (to) params.end_date = to;

  const [data, overview] = await Promise.all([
    apiGet(API_ROUTES.payouts, { params }),
    apiGet(API_ROUTES.payouts, {
      params: {
        page: 1,
        page_size: PAYOUT_OVERVIEW_SIZE,
        sort_by: "created_at",
        sort_order: "desc",
      },
    }),
  ]);

  const items = asPayoutList(data).map(mapPayout);
  const all = asPayoutList(overview).map(mapPayout);

  const awaiting = all.filter((payout) => payout.isAwaiting);
  const settled = all.filter((payout) => payout.isSettled);
  const failed = all.filter((payout) => payout.isFailed);

  const summary = {
    total: overview?.pagination?.total_items ?? all.length,
    awaitingCount: awaiting.length,
    awaitingAmount: sumAmounts(awaiting),
    settledCount: settled.length,
    settledAmount: sumAmounts(settled),
    failedCount: failed.length,
  };

  return {
    items,
    total: data?.pagination?.total_items ?? items.length,
    page,
    limit,
    summary,
  };
}

export const approvePayout = (payoutId, notes) =>
  apiPut(`${API_ROUTES.payouts}/${payoutId}/approve`, notes ? { notes } : {});

export const rejectPayout = (payoutId, reason) =>
  apiPut(`${API_ROUTES.payouts}/${payoutId}/reject`, { reason });

export const retryPayout = (payoutId) =>
  apiPut(`${API_ROUTES.payouts}/${payoutId}/retry`, {});
