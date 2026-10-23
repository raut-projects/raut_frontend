import { useState } from 'react'
import { QueryError, RefreshIndicator, TableSkeleton } from '../components/queryStates.jsx'
import { ReasonDialog } from '../components/reasonDialog.jsx'
import ViewRidePanel from '../components/viewRidePanel.jsx'
import { useRideSummary, useRides } from '../hooks/useRides.js'
import { useDrivers } from '../hooks/useDrivers.js'
import { useCancelRide } from '../hooks/useAdminActions.js'

const statusStyles = {
  Pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  'In transit': 'bg-brand-50 text-brand-700 ring-brand-600/20',
  Delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Cancelled: 'bg-slate-100 text-slate-600 ring-slate-500/20',
}

const statusDots = {
  Pending: 'bg-amber-500',
  'In transit': 'bg-brand-500',
  Delivered: 'bg-emerald-500',
  Cancelled: 'bg-slate-400',
}

const statusLabels = {
  requested: 'Pending',
  picked_up: 'In transit',
  completed: 'Delivered',
  cancelled: 'Cancelled',
}

const TERMINAL_STATUSES = ['completed', 'cancelled', 'rejected', 'expired']

const PAGE_SIZE = 10

const controlClass =
  'rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100'

const actionClass =
  'cursor-pointer font-semibold text-brand-600 transition-colors hover:text-brand-700 disabled:cursor-not-allowed disabled:text-slate-300'

const dangerClass =
  'cursor-pointer font-semibold text-rose-600 transition-colors hover:text-rose-700 disabled:cursor-not-allowed disabled:text-slate-300'

function Rides() {
  const [status, setStatus] = useState('all')
  const [driverId, setDriverId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [viewTarget, setViewTarget] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelReason, setCancelReason] = useState('')

  const params = { status, driverId, from, to, page, limit: PAGE_SIZE }

  const {
    data,
    isPending,
    isError,
    error,
    isFetching,
    isPlaceholderData,
    dataUpdatedAt,
    refetch,
  } = useRides(params)

  const { data: summary, isPending: summaryPending } = useRideSummary()

  // The driver filter needs the fleet, the backend filters rides by driver id.
  const { data: driverData } = useDrivers({ page: 1, limit: 100 })
  const drivers = driverData?.items ?? []

  const cancelRide = useCancelRide()

  const rides = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const summaryCards = [
    { label: 'Total rides', value: summary?.total ?? 0, hint: 'On record', status: 'all' },
    { label: 'Pending', value: summary?.pending ?? 0, hint: 'Awaiting a driver', status: 'requested' },
    { label: 'Delivered', value: summary?.delivered ?? 0, hint: 'Completed trips', status: 'completed' },
    { label: 'Cancelled', value: summary?.cancelled ?? 0, hint: 'Cancelled trips', status: 'cancelled' },
  ]

  const resetPage = () => setPage(1)

  const onStatusChange = (next) => {
    setStatus(next)
    resetPage()
  }

  const onDriverChange = (next) => {
    setDriverId(next)
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
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Rides</h2>
          <p className="mt-1 text-sm text-slate-500">
            {isPending
              ? 'Loading rides.'
              : status === 'all'
                ? `${total} ride${total === 1 ? '' : 's'} on record`
                : `${total} ${statusLabels[status] ?? status} ride${total === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            aria-label="Filter rides by status"
            className={controlClass}
          >
            <option value="all">All statuses</option>
            <option value="requested">Pending</option>
            <option value="picked_up">In transit</option>
            <option value="completed">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={driverId}
            onChange={(event) => onDriverChange(event.target.value)}
            aria-label="Filter rides by driver"
            className={`${controlClass} max-w-48`}
          >
            <option value="">All drivers</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={from}
            onChange={(event) => onFromChange(event.target.value)}
            aria-label="Rides requested from"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />

          <input
            type="date"
            value={to}
            onChange={(event) => onToChange(event.target.value)}
            aria-label="Rides requested until"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const active = status === card.status

          return (
            <button
              key={card.label}
              type="button"
              onClick={() => onStatusChange(card.status)}
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
                <th className="table-th">Ride</th>
                <th className="table-th">Customer</th>
                <th className="table-th">Driver</th>
                <th className="table-th">Route</th>
                <th className="table-th">Fare</th>
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
                {rides.map((ride) => (
                  <tr key={ride.id} className="transition-colors hover:bg-slate-50">
                    <td className="table-td font-medium text-slate-900">{ride.id}</td>
                    <td className="table-td">
                      <span className="block text-slate-900">{ride.customer}</span>
                      <span className="block text-xs text-slate-400">{ride.customerPhone}</span>
                    </td>
                    <td className="table-td">
                      <span className="block text-slate-900">{ride.driver}</span>
                      <span className="block text-xs text-slate-400">{ride.driverPhone}</span>
                    </td>
                    <td className="table-td">
                      <span className="block max-w-[16rem] truncate text-slate-700">{ride.route}</span>
                    </td>
                    <td className="table-td font-medium text-slate-900">{ride.amount}</td>
                    <td className="table-td">
                      <span
                        className={`badge ring-1 ring-inset ${
                          statusStyles[ride.status] ?? statusStyles.Pending
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${statusDots[ride.status] ?? statusDots.Pending}`}
                          aria-hidden="true"
                        />
                        {ride.status}
                      </span>
                    </td>
                    <td className="table-td">{ride.date}</td>
                    <td className="table-td">
                      <div className="flex items-center justify-end gap-3">
                        <button type="button" onClick={() => setViewTarget(ride)} className={actionClass}>
                          View
                        </button>
                        {TERMINAL_STATUSES.includes(ride.statusKey) ? (
                          <span className="text-xs text-slate-400">No action</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setCancelReason('')
                              setCancelTarget(ride)
                            }}
                            className={dangerClass}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {rides.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">
                      No rides match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            )}
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3.5">
          <p className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-700">{rides.length}</span> of{' '}
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

      <ViewRidePanel open={Boolean(viewTarget)} onClose={() => setViewTarget(null)} ride={viewTarget} />

      <ReasonDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title="Cancel ride"
        description={
          cancelTarget
            ? `${cancelTarget.id} for ${cancelTarget.customer} will be cancelled and the fare refunded.`
            : undefined
        }
        confirmLabel="Cancel ride"
        label="Reason"
        tone="danger"
        placeholder="Why is this ride being cancelled?"
        value={cancelReason}
        onChange={setCancelReason}
        pending={cancelRide.isPending}
        onConfirm={async (reason) => {
          await cancelRide.mutateAsync({
            rideId: cancelTarget.rideId,
            reason,
            refund: true,
          })
          setCancelTarget(null)
        }}
      />
    </div>
  )
}

export default Rides
