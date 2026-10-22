import { API_ROUTES } from '../lib/config.js'
import { apiGet } from './api.js'
import { mapDelivery, RIDE_STATUS_FILTERS } from './mappers.js'

export async function listDeliveries({ search = '', status = 'all', page = 1, limit = 10 } = {}) {
  const params = {
    page,
    page_size: limit,
    sort_by: 'created_at',
    sort_order: 'desc',
  }

  if (status && status !== 'all') {
    params.status = RIDE_STATUS_FILTERS[status] ?? String(status).toLowerCase()
  }

  const data = await apiGet(API_ROUTES.rides, { params })

  let items = (data?.items ?? []).map(mapDelivery)

  // The rides endpoint has no search parameter, so the lookup runs against the
  // page that is already loaded.
  const query = String(search ?? '').trim().toLowerCase()

  if (query) {
    items = items.filter((delivery) =>
      [delivery.id, delivery.customer, delivery.rider, delivery.zone].some((value) =>
        String(value).toLowerCase().includes(query),
      ),
    )
  }

  return {
    items,
    total: query ? items.length : (data?.pagination?.total_items ?? items.length),
    page,
    limit,
  }
}
