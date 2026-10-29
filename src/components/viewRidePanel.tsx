import SidePanel from './SidePanel.jsx'

const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-600'
const valueClass = 'block rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700'

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

function ViewRidePanel({ open, onClose, ride }) {
  if (!ride) {
    return (
      <SidePanel
        open={open}
        onClose={onClose}
        title="Ride details"
        description="View ride information"
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
      title="Ride details"
      description={`${ride.id} - ${ride.customer}`}
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
            <p className="text-xs font-semibold text-slate-500">Fare</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{ride.amount}</p>
            <p className="mt-1 text-sm text-slate-500">{ride.route}</p>
          </div>
          <span
            className={`badge shrink-0 ring-1 ring-inset ${
              statusStyles[ride.status] ?? statusStyles.Pending
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${statusDots[ride.status] ?? statusDots.Pending}`}
              aria-hidden="true"
            />
            {ride.status}
          </span>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Customer</h3>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className={labelClass}>Full name</span>
              <div className={valueClass}>{ride.customer}</div>
            </label>
            <label className="block">
              <span className={labelClass}>Phone</span>
              <div className={valueClass}>{ride.customerPhone}</div>
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Driver</h3>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className={labelClass}>Full name</span>
              <div className={valueClass}>{ride.driver}</div>
            </label>
            <label className="block">
              <span className={labelClass}>Phone</span>
              <div className={valueClass}>{ride.driverPhone}</div>
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Trip</h3>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className={labelClass}>Pickup</span>
              <div className={valueClass}>{ride.pickup}</div>
            </label>
            <label className="block">
              <span className={labelClass}>Dropoff</span>
              <div className={valueClass}>{ride.dropoff}</div>
            </label>
            <label className="block">
              <span className={labelClass}>Zone</span>
              <div className={valueClass}>{ride.zone}</div>
            </label>
            <label className="block">
              <span className={labelClass}>Seats</span>
              <div className={valueClass}>{ride.seats}</div>
            </label>
            <label className="block">
              <span className={labelClass}>Requested</span>
              <div className={valueClass}>{ride.requestedAt}</div>
            </label>
            <label className="block">
              <span className={labelClass}>Ride ID</span>
              <div className={valueClass}>{ride.id}</div>
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Payment</h3>
          <div className="grid grid-cols-3 gap-4">
            <label className="block">
              <span className={labelClass}>Fare</span>
              <div className={valueClass}>{ride.amount}</div>
            </label>
            <label className="block">
              <span className={labelClass}>Platform fee</span>
              <div className={valueClass}>{ride.platformFee}</div>
            </label>
            <label className="block">
              <span className={labelClass}>Driver earning</span>
              <div className={valueClass}>{ride.driverEarning}</div>
            </label>
          </div>
        </section>
      </div>
    </SidePanel>
  )
}

export default ViewRidePanel
