import { useState } from 'react'
import { QueryError, RefreshIndicator, TableSkeleton } from '../components/queryStates.jsx'
import { useTransactionSummary, useTransactions } from '../hooks/useTransactions.js'

const statusStyles = {
  Pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Processing: 'bg-brand-50 text-brand-700 ring-brand-600/20',
  Completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Failed: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  Cancelled: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  Refunded: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  Reversed: 'bg-rose-50 text-rose-700 ring-rose-600/20',
}

const statusDots = {
  Pending: 'bg-amber-500',
  Processing: 'bg-brand-500',
  Completed: 'bg-emerald-500',
  Failed: 'bg-rose-500',
  Cancelled: 'bg-slate-400',
  Refunded: 'bg-slate-400',
  Reversed: 'bg-rose-500',
}

const typeStyles = {
  Payment: 'bg-brand-50 text-brand-700',
  'Ride Payment': 'bg-brand-50 text-brand-700',
  Fare: 'bg-brand-50 text-brand-700',
  Payout: 'bg-violet-50 text-violet-700',
  Withdrawal: 'bg-violet-50 text-violet-700',
  Refund: 'bg-amber-50 text-amber-700',
  Commission: 'bg-slate-100 text-slate-700',
  Fee: 'bg-slate-100 text-slate-700',
  'Top Up': 'bg-emerald-50 text-emerald-700',
  Deposit: 'bg-emerald-50 text-emerald-700',
}

const PAGE_SIZE = 10

const controlClass =
  'rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100'

function Transactions() {
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)

  const params = { status, type, from, to, page, limit: PAGE_SIZE }

  const {
    data,
    isPending,
    isError,
    error,
    isFetching,
    isPlaceholderData,
    dataUpdatedAt,
    refetch,
  } = useTransactions(params)

  const { data: summary, isPending: summaryPending } = useTransactionSummary()

  const transactions = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const summaryCards = [
    { label: 'Total transactions', value: summary?.total ?? 0, hint: 'On record', status: 'all', type: 'all' },
    { label: 'Pending', value: summary?.pending ?? 0, hint: 'In progress', status: 'pending', type: 'all' },
    { label: 'Completed', value: summary?.completed ?? 0, hint: 'Successful', status: 'completed', type: 'all' },
    { label: 'Failed', value: summary?.failed ?? 0, hint: 'Failed/Cancelled', status: 'failed', type: 'all' },
  ]

  const resetPage = () => setPage(1)

  const onStatusChange = (next) => {
    setStatus(next)
    resetPage()
  }

  const onTypeChange = (next) => {
    setType(next)
    resetPage()
  }

  const onFromChange = (next) => {
    setFrom(next)
    resetPage()
  }

  const onToChange = (next) => {
    setTo(next)
    resetPage()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Transactions</h2>
          <p className="mt-1 text-sm text-slate-500">
            {isPending
              ? 'Loading transactions…'
              : status === 'all'
                ? `${total} transaction${total === 1 ? '' : 's'} on record`
                : `${total} ${status} transaction${total === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            aria-label="Filter transactions by status"
            className={controlClass}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>

          <select
            value={type}
            onChange={(event) => onTypeChange(event.target.value)}
            aria-label="Filter transactions by type"
            className={controlClass}
          >
            <option value="all">All types</option>
            <option value="payment">Payment</option>
            <option value="payout">Payout</option>
            <option value="refund">Refund</option>
            <option value="commission">Commission</option>
            <option value="fee">Fee</option>
          </select>

          <input
            type="date"
            value={from}
            onChange={(event) => onFromChange(event.target.value)}
            aria-label="Transactions from"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />

          <input
            type="date"
            value={to}
            onChange={(event) => onToChange(event.target.value)}
            aria-label="Transactions until"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const active = status === card.status && type === card.type

          return (
            <button
              key={card.label}
              type="button"
              onClick={() => {
                setStatus(card.status)
                setType(card.type)
                resetPage()
              }}
              aria-pressed={active}
              className={`cursor-pointer stat-card text-left transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
                active ? 'ring-2 ring-brand-500' : 'hover:shadow-md'
              }`}
            >
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{card.label}</p>
              <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
                {summaryPending ? '-' : card.value}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{card.hint}</p>
            </button>
          )
        })}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <RefreshIndicator isFetching={isFetching} updatedAt={dataUpdatedAt} onRefresh={refetch} />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-th">Reference</th>
                <th className="table-th">User</th>
                <th className="table-th">Type</th>
                <th className="table-th">Amount</th>
                <th className="table-th">Status</th>
                <th className="table-th">Date</th>
                <th className="table-th">Description</th>
              </tr>
            </thead>

            {isPending && <TableSkeleton rows={PAGE_SIZE} cols={7} />}

            {isError && (
              <tbody>
                <tr>
                  <td colSpan={7}>
                    <QueryError error={error} onRetry={refetch} />
                  </td>
                </tr>
              </tbody>
            )}

            {!isPending && !isError && (
              <tbody className="divide-y divide-slate-100">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="transition-colors hover:bg-slate-50">
                    <td className="table-td">
                      <span className="block font-medium text-slate-900">{transaction.reference}</span>
                      <span className="block text-xs text-slate-400">{transaction.id}</span>
                    </td>
                    <td className="table-td">
                      <span className="block text-slate-900">{transaction.userName}</span>
                      {transaction.userPhone !== '—' && (
                        <span className="block text-xs text-slate-400">{transaction.userPhone}</span>
                      )}
                    </td>
                    <td className="table-td">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          typeStyles[transaction.type] ?? 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {transaction.type || '—'}
                      </span>
                    </td>
                    <td className="table-td font-medium text-slate-900">{transaction.amountLabel}</td>
                    <td className="table-td">
                      <span
                        className={`badge ring-1 ring-inset ${
                          statusStyles[transaction.status] ?? statusStyles.Pending
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            statusDots[transaction.status] ?? statusDots.Pending
                          }`}
                          aria-hidden="true"
                        />
                        {transaction.status}
                      </span>
                    </td>
                    <td className="table-td">
                      <span className="block text-slate-900">{transaction.created}</span>
                      <span className="block text-xs text-slate-400">{transaction.createdAt?.split(' ')[1] ?? ''}</span>
                    </td>
                    <td className="table-td">
                      <span className="block max-w-[16rem] truncate text-slate-700">
                        {transaction.description || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                      No transactions match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            )}
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3.5">
          <p className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-700">{transactions.length}</span> of{' '}
            <span className="font-semibold text-slate-700">{total}</span>
            {totalPages > 1 && (
              <>
                {' '}
                - Page <span className="font-semibold text-slate-700">{page}</span> of{' '}
                <span className="font-semibold text-slate-700">{totalPages}</span>
              </>
            )}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1 || isPlaceholderData}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-white"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages || isPlaceholderData}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-white"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Transactions
