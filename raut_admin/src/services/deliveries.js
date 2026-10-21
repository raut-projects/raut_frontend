import { db } from '../mocks/db.js'
import { matches, requireSession, wait } from './mockApi.js'

export async function listDeliveries({ search = '', status = 'all', page = 1, limit = 10 } = {}) {
  requireSession()
  await wait()

  const query = search.trim().toLowerCase()
  let rows = db.deliveries

  if (status && status !== 'all') rows = rows.filter((delivery) => delivery.status === status)

  if (query) {
    rows = rows.filter(
      (delivery) =>
        matches(delivery.id, query) ||
        matches(delivery.customer, query) ||
        matches(delivery.rider, query) ||
        matches(delivery.zone, query),
    )
  }

  const start = (page - 1) * limit

  return {
    items: rows.slice(start, start + limit),
    total: rows.length,
    page,
    limit,
  }
}
