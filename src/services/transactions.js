import { API_ROUTES } from '../lib/config.js'
import { apiGet } from './api.js'
import { mapTransaction } from './mappers.js'

const SUMMARY_STATUSES = ['pending', 'completed', 'failed']

const countTransactions = async (status) => {
  const params = { page: 1, page_size: 1 }

  if (status && status !== 'all') params.status = status

  const data = await apiGet(API_ROUTES.transactions, { params })

  return data?.pagination?.total_items ?? 0
}

const asTransactionList = (payload) => {
  if (Array.isArray(payload)) return payload

  return payload?.items ?? payload?.transactions ?? payload?.results ?? []
}

export async function listTransactions({
  status = 'all',
  type = 'all',
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
  if (type && type !== 'all') params.type = String(type).toLowerCase()
  if (from) params.start_date = from
  if (to) params.end_date = to

  const data = await apiGet(API_ROUTES.transactions, { params })
  const items = asTransactionList(data).map(mapTransaction)

  return {
    items,
    total: data?.pagination?.total_items ?? items.length,
    page,
    limit,
  }
}

export async function getTransactionSummary() {
  const [total, pending, completed, failed] = await Promise.all([
    countTransactions(),
    countTransactions('pending'),
    countTransactions('completed'),
    countTransactions('failed'),
  ])

  return { total, pending, completed, failed }
}

