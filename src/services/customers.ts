import { API_ROUTES } from '../lib/config'
import { apiGet } from './api'
import { mapCustomer } from './mappers'

export async function listCustomers({ search = '', status = 'all', page = 1, limit = 8 } = {}) {
  const query = String(search ?? '').trim()

  const params = {
    page,
    page_size: limit,
    is_driver: false,
    sort_by: 'created_at',
    sort_order: 'desc',
  }

  if (query) params.search = query
  const state = String(status).toLowerCase()
  if (state === 'active') params.is_active = true
  if (state === 'inactive') params.is_active = false

  const data = await apiGet(API_ROUTES.users, { params })
  const items = (data?.items ?? []).map(mapCustomer)

  return {
    items,
    total: data?.pagination?.total_items ?? items.length,
    page,
    limit,
  }
}
