import { API_ROUTES } from '../lib/config.js'
import { apiGet } from './api.js'
import { mapRider } from './mappers.js'

// The fleet is small enough to pull in one page, which lets the summary cards
// report exact per-status counts without six extra requests.
const FLEET_PAGE_SIZE = 100

export async function listRiders({ search = '', status = 'all', page = 1, limit = 8 } = {}) {
  requireSession()
  await wait()

  const query = search.trim().toLowerCase()
  let rows = db.riders

  if (status && status !== 'all') rows = rows.filter((rider) => rider.status === status)

  if (query) {
    rows = rows.filter(
      (rider) =>
        matches(rider.name, query) ||
        matches(rider.zone, query) ||
        matches(rider.phone, query),
    )
  }

  const start = (page - 1) * limit

  return {
    items: rows.slice(start, start + limit),
    total: rows.length,
    page,
    limit,
    summary: buildSummary(),
  }
}

export async function createRider({ name, phone, zone, status }) {
  requireSession()
  await wait()

  if (name.toLowerCase().includes('fail')) {
    throw requestError('The server rejected this rider. Please try again.')
  }

  const record = {
    id: Math.max(0, ...db.riders.map((rider) => rider.id)) + 1,
    name,
    phone,
    zone,
    status,
    deliveries: 0,
    rating: 5.0,
  }

  db.riders = [record, ...db.riders]

  return record
}
