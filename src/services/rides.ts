import { API_ROUTES } from '../lib/config.js'
import { apiGet } from './api.js'
import { mapRide } from './mappers.js'

// Every summary card is a single status count, so each one is read from
// pagination.total_items instead of paging through the whole book of rides.
const SUMMARY_STATUSES = ['requested', 'completed', 'cancelled']

const countRides = async (status) => {
  const params = { page: 1, page_size: 1 }

  if (status) params.status = status

  const data = await apiGet(API_ROUTES.rides, { params })

  return data?.pagination?.total_items ?? 0
}

export async function listRides({
  status = 'all',
  driverId = '',
  from = '',
  to = '',
  page = 1,
  limit = 10,
} = {}) {
  const params = {
    page,
    page_size: limit,
    sort_by: 'created_at',
    sort_order: 'desc',
  }

  if (status && status !== 'all') params.status = String(status).toLowerCase()
  if (driverId) params.driver_id = driverId
  if (from) params.start_date = from
  if (to) params.end_date = to

  const data = await apiGet(API_ROUTES.rides, { params })
  const items = (data?.items ?? []).map(mapRide)

  return {
    items,
    total: data?.pagination?.total_items ?? items.length,
    page,
    limit,
  }
}

export async function getRideSummary() {
  const [total, pending, delivered, cancelled] = await Promise.all([
    countRides(),
    ...SUMMARY_STATUSES.map(countRides),
  ])

  return { total, pending, delivered, cancelled }
}
