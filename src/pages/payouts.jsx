import { useState } from 'react'
import { QueryError, RefreshIndicator, TableSkeleton } from '../components/queryStates.jsx'
import { ConfirmDialog, ReasonDialog } from '../components/reasonDialog.jsx'
import ViewPayoutPanel from '../components/viewPayoutPanel.jsx'
import { usePayouts } from '../hooks/usePayouts.js'
import { useDrivers } from '../hooks/useDrivers.js'
import { useApprovePayout, useRejectPayout, useRetryPayout } from '../hooks/useAdminActions.js'
import { formatMoney } from '../services/mappers.js'

const statusStyles = {
  Pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Scheduled: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Processing: 'bg-brand-50 text-brand-700 ring-brand-600/20',
  Approved: 'bg-brand-50 text-brand-700 ring-brand-600/20',
  Paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Failed: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  Reversed: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  Rejected: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  Cancelled: 'bg-slate-100 text-slate-600 ring-slate-500/20',
}

const statusDots = {
  Pending: 'bg-amber-500',
  Scheduled: 'bg-amber-500',
  Processing: 'bg-brand-500',
  Approved: 'bg-brand-500',
  Paid: 'bg-emerald-500',
  Failed: 'bg-rose-500',
  Reversed: 'bg-rose-500',
  Rejected: 'bg-rose-500',
  Cancelled: 'bg-slate-400',
}

const PAGE_SIZE = 8

const controlClass =
  'rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100'

const actionClass =
  'cursor-pointer font-semibold text-brand-600 transition-colors hover:text-brand-700 disabled:cursor-not-allowed disabled:text-slate-300'

const dangerClass =
  'cursor-pointer font-semibold text-rose-600 transition-colors hover:text-rose-700 disabled:cursor-not-allowed disabled:text-slate-300'

function Payouts() {
  const [status, setStatus] = useState('all')
  const [method, setMethod] = useState('all')
  const [driverId, setDriverId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [viewTarget, setViewTarget] = useState(null)
  const [approveTarget, setApproveTarget] = useState(null)
  const [approveNotes, setApproveNotes] = useState('')
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [retryTarget, setRetryTarget] = useState(null)

  const params = { status, method, driverId, from, to, page, limit: PAGE_SIZE }

  const {
    data,
    isPending,
    isError,
    error,
    isFetching,
    isPlaceholderData,
    dataUpdatedAt,
    refetch,
  } = usePayouts(params)

  // The driver filter needs the fleet, the backend filters payouts by driver id.
  const { data: driverData } = useDrivers({ page: 1, limit: 100 })
  const drivers = driverData?.items ?? []

  const approvePayout = useApprovePayout()
  const rejectPayout = useRejectPayout()
  const retryPayout = useRetryPayout()

  const payouts = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const summary = data?.summary

  const summaryCards = [
    {
      label: 'Awaiting approval',
      value: summary?.awaitingCount ?? 0,
      hint: formatMoney(summary?.awaitingAmount ?? 0),
      status: 'pending',
    },
    {
      label: 'Paid',
      value: summary?.settledCount ?? 0,
      hint: formatMoney(summary?.settledAmount ?? 0),
      status: 'paid',
    },
    {
      label: 'Needs retry',
      value: summary?.failedCount ?? 0,
      hint: 'Failed attempts',
      status: 'failed',
    },
    {
      label: 'Total payouts',
      value: summary?.total ?? total,
      hint: 'On record',
      status: 'all',
    },
  ]

  const resetPage = () => setPage(1)

  const onStatusChange = (next) => {
    setStatus(next)
    resetPage()
  }

  const onMethodChange = (next) => {
    setMethod(next)
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
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Payouts</h2>
          <p className="mt-1 text-sm text-slate-500">
            {isPending
              ? 'Loading payouts…'
              : status === 'all'
                ? `${total} payout${total === 1 ? '' : 's'} on record`
                : `${total} ${status} payout${total === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            aria-label="Filter payouts by status"
            className={controlClass}
          >
            <option value="all">All statuses</option>
            <option value="pending">Awaiting approval</option>
            <option value="processing">Processing</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={method}
            onChange={(event) => onMethodChange(event.target.value)}
            aria-label="Filter payouts by method"
            className={controlClass}
          >
            <option value="all">All methods</option>
            <option value="mobile_money">Mobile money</option>
            <option value="mpesa">M-Pesa</option>
            <option value="bank">Bank transfer</option>
            <option value="cash">Cash</option>
          </select>

          <select
            value={driverId}
            onChange={(event) => onDriverChange(event.target.value)}
            aria-label="Filter payouts by driver"
            className={`${controlClass} max-w-[12rem]`}
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
            aria-label="Payouts requested from"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />

          <input
            type="date"
            value={to}
            onChange={(event) => onToChange(event.target.value)}
            aria-label="Payouts requested until"
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
              <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">{card.value}</p>
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
                <th className="table-th">Driver</th>
                <th className="table-th">Amount</th>
                <th className="table-th">Method</th>
                <th className="table-th">Status</th>
                <th className="table-th">Reference</th>
                <th className="table-th">Requested</th>
                <th className="table-th text-right">Actions</th>
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
                {payouts.map((payout) => (
                  <tr key={payout.id} className="transition-colors hover:bg-slate-50">
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                          {payout.driverName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)}
                        </span>
                        <span className="font-medium text-slate-900">{payout.driverName}</span>
                      </div>
                    </td>
                    <td className="table-td font-medium text-slate-900">{payout.amountLabel}</td>
                    <td className="table-td">
                      <span className="block text-slate-700">{payout.method}</span>
                      {payout.methodDetails !== '—' && (
                        <span className="block text-xs text-slate-400">{payout.methodDetails}</span>
                      )}
                    </td>
                    <td className="table-td">
                      <span
                        className={`badge ring-1 ring-inset ${
                          statusStyles[payout.status] ?? statusStyles.Pending
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${statusDots[payout.status] ?? statusDots.Pending}`}
                          aria-hidden="true"
                        />
                        {payout.status}
                      </span>
                    </td>
                    <td className="table-td text-xs text-slate-500">{payout.reference}</td>
                    <td className="table-td">{payout.requestedAt}</td>
                    <td className="table-td">
                      <div className="flex items-center justify-end gap-3">
                        <button type="button" onClick={() => setViewTarget(payout)} className={actionClass}>
                          View
                        </button>
                        {payout.canApprove && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setApproveNotes('')
                                setApproveTarget(payout)
                              }}
                              className={actionClass}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectReason('')
                                setRejectTarget(payout)
                              }}
                              className={dangerClass}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {payout.canRetry && (
                          <button
                            type="button"
                            onClick={() => setRetryTarget(payout)}
                            className={actionClass}
                          >
                            Retry
                          </button>
                        )}
                        {!payout.canApprove && !payout.canRetry && (
                          <span className="text-xs text-slate-400">No action</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {payouts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                      No payouts match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            )}
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3.5">
          <p className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-700">{payouts.length}</span> of{' '}
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

      <ViewPayoutPanel open={Boolean(viewTarget)} onClose={() => setViewTarget(null)} payout={viewTarget} />

      <ReasonDialog
        open={Boolean(approveTarget)}
        onClose={() => setApproveTarget(null)}
        title="Approve payout"
        description={
          approveTarget
            ? `${approveTarget.amountLabel} for ${approveTarget.driverName} will be released.`
            : undefined
        }
        confirmLabel="Approve payout"
        label="Notes"
        optional
        placeholder="Anything the finance team should know (optional)"
        value={approveNotes}
        onChange={setApproveNotes}
        pending={approvePayout.isPending}
        onConfirm={async (notes) => {
          await approvePayout.mutateAsync({ payoutId: approveTarget.id, notes })
          setApproveTarget(null)
        }}
      />

      <ReasonDialog
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        title="Reject payout"
        description={
          rejectTarget
            ? `${rejectTarget.amountLabel} for ${rejectTarget.driverName} will not be released.`
            : undefined
        }
        confirmLabel="Reject payout"
        label="Reason"
        tone="danger"
        placeholder="Why is this payout rejected?"
        value={rejectReason}
        onChange={setRejectReason}
        pending={rejectPayout.isPending}
        onConfirm={async (reason) => {
          await rejectPayout.mutateAsync({ payoutId: rejectTarget.id, reason })
          setRejectTarget(null)
        }}
      />

      <ConfirmDialog
        open={Boolean(retryTarget)}
        onClose={() => setRetryTarget(null)}
        title="Retry payout"
        description={
          retryTarget ? `${retryTarget.amountLabel} for ${retryTarget.driverName}` : undefined
        }
        confirmLabel="Retry payout"
        onConfirm={async () => {
          await retryPayout.mutateAsync({ payoutId: retryTarget.id })
          setRetryTarget(null)
        }}
        pending={retryPayout.isPending}
      >
        <p className="text-sm text-slate-600">
          The payout goes back into the queue for another attempt. The driver is not notified until it succeeds.
        </p>
      </ConfirmDialog>
    </div>
  )
}

export default Payouts
