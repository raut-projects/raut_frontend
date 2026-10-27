import { API_ROUTES } from '../lib/config.js'
import { apiGet, apiPut } from './api.js'
import { mapPayout } from './mappers.js'

// The summary cards read the whole book of payouts, the table reads the
// filtered page. The count is capped by the overview size, like the fleet
// summary on the drivers page.
const PAYOUT_OVERVIEW_SIZE = 100

// The admin payout list has no declared response model, so the payload is read
// defensively: the rows may sit under `items`, under `payouts`, or be the
// array itself.
const asPayoutList = (payload) => {
  if (Array.isArray(payload)) return payload

  return payload?.items ?? payload?.payouts ?? payload?.results ?? []
}

const sumAmounts = (payouts) => payouts.reduce((total, payout) => total + payout.amount, 0)

export async function listPayouts({
  status = 'all',
  method = 'all',
  driverId = '',
  from = '',
  to = '',
  page = 1,
  limit = 8,
} = {}) {
  const params = {
    page,
    page_size: limit,
    sort_by: 'created_at',
    sort_order: 'desc',
  }

  if (status && status !== 'all') params.status = String(status).toLowerCase()
  if (method && method !== 'all') params.method = String(method).toLowerCase()
  if (driverId) params.driver_id = driverId
  if (from) params.start_date = from
  if (to) params.end_date = to

  const [data, overview] = await Promise.all([
    apiGet(API_ROUTES.payouts, { params }),
    apiGet(API_ROUTES.payouts, {
      params: { page: 1, page_size: PAYOUT_OVERVIEW_SIZE, sort_by: 'created_at', sort_order: 'desc' },
    }),
  ])

  const items = asPayoutList(data).map(mapPayout)
  const all = asPayoutList(overview).map(mapPayout)

  const awaiting = all.filter((payout) => payout.isAwaiting)
  const settled = all.filter((payout) => payout.isSettled)
  const failed = all.filter((payout) => payout.isFailed)

  const summary = {
    total: overview?.pagination?.total_items ?? all.length,
    awaitingCount: awaiting.length,
    awaitingAmount: sumAmounts(awaiting),
    settledCount: settled.length,
    settledAmount: sumAmounts(settled),
    failedCount: failed.length,
  }

  return {
    items,
    total: data?.pagination?.total_items ?? items.length,
    page,
    limit,
    summary,
  }
}

export const approvePayout = (payoutId, notes) =>
  apiPut(`${API_ROUTES.payouts}/${payoutId}/approve`, notes ? { notes } : {})

export const rejectPayout = (payoutId, reason) => apiPut(`${API_ROUTES.payouts}/${payoutId}/reject`, { reason })

export const retryPayout = (payoutId) => apiPut(`${API_ROUTES.payouts}/${payoutId}/retry`, {})
