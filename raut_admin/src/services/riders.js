import { db } from '../mocks/db.js'
import { matches, requestError, requireSession, wait } from './mockApi.js'

const buildSummary = () => {
  const count = (status) => db.riders.filter((rider) => rider.status === status).length
  const average =
    db.riders.length > 0
      ? (db.riders.reduce((sum, rider) => sum + rider.rating, 0) / db.riders.length).toFixed(1)
      : '—'

  return [
    { label: 'Online', value: count('Online'), color: 'text-emerald-600' },
    { label: 'Delivering', value: count('Delivering'), color: 'text-brand-600' },
    { label: 'Offline', value: count('Offline'), color: 'text-slate-500' },
    { label: 'Avg. rating', value: average, color: 'text-amber-500' },
  ]
}

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
