import { API_ROUTES } from '../lib/config.js'
import { apiGet } from './api.js'
import { mapRider } from './mappers.js'

// The fleet is small enough to pull in one page, which lets the summary cards
// report exact per-status counts without six extra requests.
const FLEET_PAGE_SIZE = 100

export async function listRiders({ search = '', status = 'all', page = 1, limit = 8 } = {}) {
  const query = String(search ?? '').trim()

  const params = {
    page,
    page_size: limit,
    sort_by: 'total_rides',
    sort_order: 'desc',
  }

  if (query) params.search = query
  if (status && status !== 'all') params.driver_status = String(status).toLowerCase()

  const [data, fleet] = await Promise.all([
    apiGet(API_ROUTES.riders, { params }),
    apiGet(API_ROUTES.riders, {
      params: { page: 1, page_size: FLEET_PAGE_SIZE, sort_by: 'total_rides', sort_order: 'desc' },
    }),
  ])

  const items = (data?.items ?? []).map(mapRider)
  const fleetItems = (fleet?.items ?? []).map(mapRider)

  const summary = {
    total: fleet?.pagination?.total_items ?? fleetItems.length,
    verified: fleetItems.filter((rider) => rider.statusKey === 'verified').length,
    pending: fleetItems.filter((rider) => rider.statusKey === 'pending').length,
    incomplete: fleetItems.filter((rider) => rider.statusKey === 'incomplete').length,
  }

  return {
    items,
    total: data?.pagination?.total_items ?? items.length,
    page,
    limit,
    summary,
  }
}
