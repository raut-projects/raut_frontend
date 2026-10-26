import SidePanel from './SidePanel.jsx'

const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-600'
const valueClass = 'block rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700'

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

const formatCoordinates = (lat, lng) =>
  Number.isFinite(lat) && Number.isFinite(lng) ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : '-'

function ViewRoutePanel({ open, onClose, route }) {
  if (!route) {
    return (
      <SidePanel
        open={open}
        onClose={onClose}
        title="Route details"
        description="View route information"
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
      title="Route details"
      description={`${route.id} - ${route.driver}`}
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
            <p className="text-xs font-semibold text-slate-500">Distance</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{route.distance}</p>
            <p className="mt-1 text-sm text-slate-500">{route.route}</p>
            <p className="mt-0.5 text-xs text-slate-400">{route.duration}</p>
          </div>
          <span
            className={`badge shrink-0 ring-1 ring-inset ${
              statusStyles[route.status] ?? statusStyles.Active
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${statusDots[route.status] ?? statusDots.Active}`}
              aria-hidden="true"
            />
            {route.status}
          </span>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Route</h3>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className={labelClass}>Origin</span>
              <div className={valueClass}>{route.origin}</div>
            </label>
            <label className="block">
              <span className={labelClass}>Destination</span>
              <div className={valueClass}>{route.destination}</div>
            </label>
            <label className="block">
              <span className={labelClass}>Distance</span>
              <div className={valueClass}>{route.distance}</div>
            </label>
            <label className="block">
              <span className={labelClass}>Duration</span>
              <div className={valueClass}>{route.duration}</div>
            </label>
            <label className="block">
              <span className={labelClass}>Available seats</span>
              <div className={valueClass}>{route.seats}</div>
            </label>
            <label className="block">
              <span className={labelClass}>Origin coordinates</span>
              <div className={valueClass}>{formatCoordinates(route.originLat, route.originLng)}</div>
            </label>
            <label className="block">
              <span className={labelClass}>Destination coordinates</span>
              <div className={valueClass}>{formatCoordinates(route.destLat, route.destLng)}</div>
            </label>
            <label className="block">
              <span className={labelClass}>Route ID</span>
              <div className={`${valueClass} truncate`}>{route.routeId ?? route.id}</div>
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Driver</h3>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className={labelClass}>Full name</span>
              <div className={valueClass}>{route.driver}</div>
            </label>
            <label className="block">
              <span className={labelClass}>Phone</span>
              <div className={valueClass}>{route.driverPhone}</div>
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Vehicle</h3>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className={labelClass}>Vehicle</span>
              <div className={valueClass}>{route.vehicle}</div>
            </label>
            <label className="block">
              <span className={labelClass}>Plate number</span>
              <div className={valueClass}>{route.plateNumber}</div>
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Activity</h3>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className={labelClass}>Active rides</span>
              <div className={valueClass}>{route.activeRides}</div>
            </label>
            <label className="block">
              <span className={labelClass}>Total rides</span>
              <div className={valueClass}>{route.totalRides}</div>
            </label>
            <label className="block">
              <span className={labelClass}>Scheduled</span>
              <div className={valueClass}>{route.scheduledFor}</div>
            </label>
            <label className="block">
              <span className={labelClass}>Created</span>
              <div className={valueClass}>{route.createdAt}</div>
            </label>
            <label className="block">
              <span className={labelClass}>Started</span>
              <div className={valueClass}>{route.startedAt}</div>
            </label>
            <label className="block">
              <span className={labelClass}>Completed</span>
              <div className={valueClass}>{route.completedAt}</div>
            </label>
          </div>
        </section>
      </div>
    </SidePanel>
  )
}

export default ViewRoutePanel
