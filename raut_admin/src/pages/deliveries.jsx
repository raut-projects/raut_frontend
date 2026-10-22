import { useState } from 'react'
import ViewDeliveryPanel from '../components/viewDeliveryPanel.jsx'
import { QueryError, RefreshIndicator, TableSkeleton } from '../components/queryStates.jsx'
import { ReasonDialog } from '../components/reasonDialog.jsx'
import { useDeliveries } from '../hooks/useDeliveries.js'
import { useDebouncedValue } from '../hooks/useDebouncedValue.js'
import { useCancelRide } from '../hooks/useAdminActions.js'

const statusStyles = {
  Delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  'In transit': 'bg-brand-50 text-brand-700 ring-brand-600/20',
  Pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Cancelled: 'bg-rose-50 text-rose-700 ring-rose-600/20',
}

const PAGE_SIZE = 10

function Deliveries() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelReason, setCancelReason] = useState('')

  const debouncedSearch = useDebouncedValue(search, 300)
  const params = { search: debouncedSearch, page, limit: PAGE_SIZE }

  const {
    data,
    isPending,
    isError,
    error,
    isFetching,
    isPlaceholderData,
    dataUpdatedAt,
    refetch,
  } = useDeliveries(params)

  const cancelRide = useCancelRide()

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const onSearchChange = (e) => {
    setSearch(e.target.value)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Deliveries</h2>
          <p className="mt-1 text-sm text-slate-500">
            {isPending ? 'Loading deliveries…' : `${total} deliver${total === 1 ? 'y' : 'ies'} recorded`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={onSearchChange}
              placeholder="Search orders, customers, riders…"
              aria-label="Search deliveries"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:w-72"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <RefreshIndicator isFetching={isFetching} updatedAt={dataUpdatedAt} onRefresh={refetch} />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-th">Order</th>
                <th className="table-th">Customer</th>
                <th className="table-th">Rider</th>
                <th className="table-th">Route</th>
                <th className="table-th">Amount</th>
                <th className="table-th">Status</th>
                <th className="table-th">Date</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>

            {isPending && <TableSkeleton rows={PAGE_SIZE} cols={8} />}

            {isError && (
              <tbody>
                <tr>
                  <td colSpan={8}>
                    <QueryError error={error} onRetry={refetch} />
                  </td>
                </tr>
              </tbody>
            )}

            {!isPending && !isError && (
              <tbody className="divide-y divide-slate-100">
                {items.map((d) => (
                  <tr key={d.id} className="transition-colors hover:bg-slate-50">
                    <td className="table-td font-medium text-slate-900">{d.id}</td>
                    <td className="table-td">{d.customer}</td>
                    <td className="table-td">{d.rider}</td>
                    <td className="table-td">{d.route}</td>
                    <td className="table-td font-medium text-slate-900">{d.amount}</td>
                    <td className="table-td">
                      <span className={`badge ring-1 ring-inset ${statusStyles[d.status]}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="table-td">{d.date}</td>
                    <td className="table-td">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDelivery(d)
                            setViewOpen(true)
                          }}
                          className="font-semibold text-brand-600 hover:text-brand-700"
                        >
                          View
                        </button>
                        {!['completed', 'cancelled', 'rejected', 'expired'].includes(d.statusKey) && (
                          <button
                            type="button"
                            onClick={() => {
                              setCancelReason('')
                              setCancelTarget(d)
                            }}
                            className="font-semibold text-rose-600 transition-colors hover:text-rose-700"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">
                      No deliveries match “{search}”.
                    </td>
                  </tr>
                )}
              </tbody>
            )}
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3.5">
          <p className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-700">{items.length}</span> of{' '}
            <span className="font-semibold text-slate-700">{total}</span>
            {totalPages > 1 && (
              <>
                {' '}
                · Page <span className="font-semibold text-slate-700">{page}</span> of{' '}
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
      <ViewDeliveryPanel
        open={viewOpen}
        onClose={() => {
          setViewOpen(false)
          setSelectedDelivery(null)
        }}
        delivery={selectedDelivery}
      />

      <ReasonDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title="Cancel ride"
        description={
          cancelTarget ? `${cancelTarget.id} will be cancelled and the rider notified.` : undefined
        }
        confirmLabel="Cancel ride"
        placeholder="Why is the ride cancelled?"
        value={cancelReason}
        onChange={setCancelReason}
        pending={cancelRide.isPending}
        onConfirm={async (reason) => {
          await cancelRide.mutateAsync({ rideId: cancelTarget.rideId, reason })
          setCancelTarget(null)
        }}
      />
    </div>
  )
}

export default Deliveries
