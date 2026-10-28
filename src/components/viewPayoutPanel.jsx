import SidePanel from './SidePanel.jsx'

const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-600'
const valueClass = 'block rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700'

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

function ViewPayoutPanel({ open, onClose, payout }) {
  if (!payout) {
    return (
      <SidePanel
        open={open}
        onClose={onClose}
        title="Payout details"
        description="View payout information"
        footer={
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Close
          </button>
        }
      />
    )
  }

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title="Payout details"
      description={payout.driverName}
      wide
      footer={
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          Close
        </button>
      }
    >
      <div className="space-y-6">
        <section className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-500">Amount</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{payout.amountLabel}</p>
            <p className="mt-1 text-sm text-slate-500">
              {payout.method}
              {payout.methodDetails !== '—' ? ` · ${payout.methodDetails}` : ''}
            </p>
          </div>
          <span
            className={`badge shrink-0 ring-1 ring-inset ${
              statusStyles[payout.status] ?? statusStyles.Pending
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${statusDots[payout.status] ?? statusDots.Pending}`}
              aria-hidden="true"
            />
            {payout.status}
          </span>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Driver</h3>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className={labelClass}>Full name</span>
              <div className={valueClass}>{payout.driverName}</div>
            </label>
            <label className="block">
              <span className={labelClass}>Phone</span>
              <div className={valueClass}>{payout.driverPhone}</div>
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Payment</h3>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className={labelClass}>Method</span>
              <div className={valueClass}>{payout.method}</div>
            </label>
            <label className="block">
              <span className={labelClass}>Destination</span>
              <div className={valueClass}>{payout.methodDetails}</div>
            </label>
            <label className="block">
              <span className={labelClass}>Reference</span>
              <div className={valueClass}>{payout.reference}</div>
            </label>
            <label className="block">
              <span className={labelClass}>Requested</span>
              <div className={valueClass}>{payout.requestedAt}</div>
            </label>
            <label className="block">
              <span className={labelClass}>Processed</span>
              <div className={valueClass}>{payout.processedAt}</div>
            </label>
            <label className="block">
              <span className={labelClass}>Earnings period</span>
              <div className={valueClass}>
                {payout.periodStart === '—' && payout.periodEnd === '—'
                  ? '—'
                  : `${payout.periodStart} → ${payout.periodEnd}`}
              </div>
            </label>
          </div>
        </section>

        {payout.rejectionReason !== '—' && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Rejection reason</h3>
            <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{payout.rejectionReason}</p>
          </section>
        )}

        {payout.notes !== '—' && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Notes</h3>
            <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">{payout.notes}</p>
          </section>
        )}
      </div>
    </SidePanel>
  )
}

export default ViewPayoutPanel
