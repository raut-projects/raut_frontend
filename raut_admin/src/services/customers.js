import { db } from '../mocks/db.js'
import { matches, requestError, requireSession, today, wait } from './mockApi.js'

export async function listCustomers({ search = '', status = 'all', page = 1, limit = 8 } = {}) {
  requireSession()
  await wait()

  const query = search.trim().toLowerCase()
  let rows = db.customers

  if (status && status !== 'all') rows = rows.filter((customer) => customer.status === status)

  if (query) {
    rows = rows.filter(
      (customer) =>
        matches(customer.name, query) ||
        matches(customer.email, query) ||
        matches(customer.phone, query),
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

export async function createCustomer({ name, email, phone, status }) {
  requireSession()
  await wait()

  if (email.toLowerCase().includes('fail')) {
    throw requestError('The server rejected this customer. Please try again.')
  }

  const record = {
    id: Math.max(0, ...db.customers.map((customer) => customer.id)) + 1,
    name,
    email,
    phone,
    status,
    orders: 0,
    joined: today(),
  }

  db.customers = [record, ...db.customers]

  return record
}
