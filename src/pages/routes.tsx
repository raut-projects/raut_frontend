import { useState } from 'react'
import { QueryError, RefreshIndicator, TableSkeleton } from '../components/queryStates.jsx'
import { ReasonDialog } from '../components/reasonDialog.jsx'
import ViewRoutePanel from '../components/viewRoutePanel.jsx'
import { useCancelRoute } from '../hooks/useAdminActions.js'
import { useDebouncedValue } from '../hooks/useDebouncedValue.js'
import { useDrivers } from '../hooks/useDrivers.js'
import { useRouteSummary, useRoutes } from '../hooks/useRoutes.js'
import { ROUTE_STATUS_LABELS } from '../services/mappers.js'

const statusStyles = {
  Scheduled: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Active: 'bg-brand-50 text-brand-700 ring-brand-600/20',
  'In progress': 'bg-brand-50 text-brand-700 ring-brand-600/20',
  Completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Cancelled: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  Expired: 'bg-slate-100 text-slate-600 ring-slate-500/20',
}

const statusDots = {
  Scheduled: 'bg-amber-500',
  Active: 'bg-brand-500',
  'In progress': 'bg-brand-500',
  Completed: 'bg-emerald-500',
  Cancelled: 'bg-slate-400',
  Expired: 'bg-slate-400',
}

const PAGE_SIZE = 10

const controlClass =
  'rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100'

const inputClass =
  'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100'

const actionClass =
  'cursor-pointer font-semibold text-brand-600 transition-colors hover:text-brand-700 disabled:cursor-not-allowed disabled:text-slate-300'

const dangerClass =
  'cursor-pointer font-semibold text-rose-600 transition-colors hover:text-rose-700 disabled:cursor-not-allowed disabled:text-slate-300'

function RoutesPage() {
  const [status, setStatus] = useState('all')
  const [driverId, setDriverId] = useState('')
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [viewTarget, setViewTarget] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelRides, setCancelRides] = useState(true)

  const debouncedOrigin = useDebouncedValue(origin, 300)
  const debouncedDestination = useDebouncedValue(destination, 300)

  const params = {
    status,
    driverId,
    origin: debouncedOrigin.trim(),
    destination: debouncedDestination.trim(),
    from,
    to,
    page,
    limit: PAGE_SIZE,
  }

  const {
    data,
    isPending,
    isError,
    error,
    isFetching,
    isPlaceholderData,
    dataUpdatedAt,
    refetch,
  } = useRoutes(params)

  const { data: summary, isPending: summaryPending } = useRouteSummary()
  const { data: driverData } = useDrivers({ page: 1, limit: 100 })

  const drivers = driverData?.items ?? []
  const cancelRoute = useCancelRoute()

  const routes = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const summaryCards = [
    { label: 'Total routes', value: summary?.total ?? 0, hint: 'On record', status: 'all' },
    { label: 'Active', value: summary?.active ?? 0, hint: 'Running now', status: 'active' },
    { label: 'Completed', value: summary?.completed ?? 0, hint: 'Finished routes', status: 'completed' },
    { label: 'Cancelled', value: summary?.cancelled ?? 0, hint: 'Stopped routes', status: 'cancelled' },
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

  const onOriginChange = (next) => {
    setOrigin(next)
    resetPage()
  }

  const onDestinationChange = (next) => {
    setDestination(next)
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

  const openCancelDialog = (route) => {
    setCancelReason('')
    setCancelRides(true)
    setCancelTarget(route)
  }

  const closeCancelDialog = () => {
    if (cancelRoute.isPending) return
    setCancelTarget(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Routes</h2>
          <p className="mt-1 text-sm text-slate-500">
            {isPending
              ? 'Loading routes.'
              : status === 'all'
                ? `${total} route${total === 1 ? '' : 's'} on record`
                : `${total} ${ROUTE_STATUS_LABELS[status] ?? status} route${total === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            aria-label="Filter routes by status"
            className={controlClass}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={driverId}
            onChange={(event) => onDriverChange(event.target.value)}
            aria-label="Filter routes by driver"
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
            type="search"
            value={origin}
            onChange={(event) => onOriginChange(event.target.value)}
            placeholder="Search origin"
            aria-label="Filter routes by origin"
            className={`${inputClass} w-44`}
          />

          <input
            type="search"
            value={destination}
            onChange={(event) => onDestinationChange(event.target.value)}
            placeholder="Search destination"
            aria-label="Filter routes by destination"
            className={`${inputClass} w-44`}
          />

          <input
            type="date"
            value={from}
            onChange={(event) => onFromChange(event.target.value)}
            aria-label="Routes created from"
            className={inputClass}
          />

          <input
            type="date"
            value={to}
            onChange={(event) => onToChange(event.target.value)}
            aria-label="Routes created until"
            className={inputClass}
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
                <th className="table-th">Route</th>
                <th className="table-th">Driver</th>
                <th className="table-th">Vehicle</th>
                <th className="table-th">Distance</th>
                <th className="table-th">Seats</th>
                <th className="table-th">Rides</th>
                <th className="table-th">Status</th>
                <th className="table-th">Created</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>

            {isPending && <TableSkeleton rows={PAGE_SIZE} cols={9} />}

            {isError && (
              <tbody>
                <tr>
                  <td colSpan={9}>
                    <QueryError error={error} onRetry={refetch} />
                  </td>
                </tr>
              </tbody>
            )}

            {!isPending && !isError && (
              <tbody className="divide-y divide-slate-100">
                {routes.map((route) => (
                  <tr key={route.routeId} className="transition-colors hover:bg-slate-50">
                    <td className="table-td">
                      <span className="block max-w-[18rem] truncate font-medium text-slate-900">
                        {route.route}
                      </span>
                      <span className="block text-xs text-slate-400">{route.id}</span>
                    </td>
                    <td className="table-td">
                      <span className="block text-slate-900">{route.driver}</span>
                      <span className="block text-xs text-slate-400">{route.driverPhone}</span>
                    </td>
                    <td className="table-td">
                      <span className="block max-w-[14rem] truncate text-slate-900">{route.vehicle}</span>
                      <span className="block text-xs text-slate-400">{route.plateNumber}</span>
                    </td>
                    <td className="table-td">
                      <span className="block text-slate-900">{route.distance}</span>
                      <span className="block text-xs text-slate-400">{route.duration}</span>
                    </td>
                    <td className="table-td text-slate-700">{route.seats}</td>
                    <td className="table-td">
                      <span className="block text-slate-900">{route.totalRides} total</span>
                      <span className="block text-xs text-slate-400">{route.activeRides} active</span>
                    </td>
                    <td className="table-td">
                      <span
                        className={`badge ring-1 ring-inset ${
                          statusStyles[route.status] ?? statusStyles.Active
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            statusDots[route.status] ?? statusDots.Active
                          }`}
                          aria-hidden="true"
                        />
                        {route.status}
                      </span>
                    </td>
                    <td className="table-td">{route.created}</td>
                    <td className="table-td">
                      <div className="flex items-center justify-end gap-3">
                        <button type="button" onClick={() => setViewTarget(route)} className={actionClass}>
                          View
                        </button>
                        {route.canCancel ? (
                          <button
                            type="button"
                            onClick={() => openCancelDialog(route)}
                            className={dangerClass}
                          >
                            Cancel
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">No action</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {routes.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-500">
                      No routes match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            )}
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3.5">
          <p className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-700">{routes.length}</span> of{' '}
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

      <ViewRoutePanel open={Boolean(viewTarget)} onClose={() => setViewTarget(null)} route={viewTarget} />

      <ReasonDialog
        open={Boolean(cancelTarget)}
        onClose={closeCancelDialog}
        title="Cancel route"
        description={
          cancelTarget
            ? `${cancelTarget.route} (${cancelTarget.id}) will be cancelled${
                cancelRides ? ' along with its active rides' : ''
              }.`
            : undefined
        }
        confirmLabel="Cancel route"
        label="Reason"
        tone="danger"
        placeholder="Why is this route being cancelled?"
        value={cancelReason}
        onChange={setCancelReason}
        pending={cancelRoute.isPending}
        onConfirm={async (reason) => {
          await cancelRoute.mutateAsync({
            routeId: cancelTarget.routeId,
            reason,
            cancelRides,
          })

          if (viewTarget?.routeId === cancelTarget.routeId) setViewTarget(null)
          setCancelTarget(null)
        }}
      >
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <input
            type="checkbox"
            checked={cancelRides}
            onChange={(event) => setCancelRides(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
          />
          <span>
            <span className="block text-sm font-medium text-slate-700">Also cancel active rides</span>
            <span className="mt-0.5 block text-xs text-slate-500">
              Riders on this route will have their rides cancelled. Leave unchecked to keep them.
            </span>
          </span>
        </label>
      </ReasonDialog>
    </div>
  )
}

export default RoutesPage
