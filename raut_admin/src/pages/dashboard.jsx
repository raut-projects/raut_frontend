import { Link } from 'react-router-dom'
import { QueryError, RefreshIndicator, TableSkeleton } from '../components/queryStates.jsx'
import { useDashboard } from '../hooks/useDashboard.js'
// import { useSession } from '../hooks/useSession.js'

const statusStyles = {
  Delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  'In transit': 'bg-brand-50 text-brand-700 ring-brand-600/20',
  Pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Cancelled: 'bg-rose-50 text-rose-700 ring-rose-600/20',
}

function Dashboard() {
  const { data, isPending, isError, error, isFetching, dataUpdatedAt, refetch } = useDashboard()
  // const session = useSession()
  // const firstName = session?.name?.split(' ')[0] ?? 'there'

  const stats = data?.stats ?? []
  const recentDeliveries = data?.recentDeliveries ?? []
  const topRiders = data?.topRiders ?? []
  const onlineRiders = data?.onlineRiders ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back, Admin</h2>
          <p className="mt-1 text-sm text-slate-500">Here is what is happening with Raut today.</p>
        </div>
        <RefreshIndicator isFetching={isFetching} updatedAt={dataUpdatedAt} onRefresh={refetch} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isPending &&
          Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="stat-card">
              <span className="block h-3.5 w-24 animate-pulse rounded bg-slate-200" />
              <span className="mt-3 block h-6 w-16 animate-pulse rounded bg-slate-200" />
              <span className="mt-2.5 block h-3 w-28 animate-pulse rounded bg-slate-200" />
            </div>
          ))}

        {!isPending &&
          !isError &&
          stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{stat.value}</p>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs">
                <span className={`font-semibold ${stat.up ? 'text-emerald-600' : 'text-rose-600'}`}>{stat.delta}</span>
                <span className="text-slate-400">{stat.hint}</span>
              </p>
            </div>
          ))}

        {isError && (
          <div className="sm:col-span-2 xl:col-span-4">
            <div className="rounded-xl border border-slate-200 bg-white shadow-card">
              <QueryError error={error} onRetry={refetch} />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-900">Recent deliveries</h3>
              <Link
                to="/deliveries"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                View all
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="table-th">Order</th>
                    <th className="table-th">Customer</th>
                    <th className="table-th">Rider</th>
                    <th className="table-th">Zone</th>
                    <th className="table-th">Amount</th>
                    <th className="table-th">Status</th>
                  </tr>
                </thead>

                {isPending && <TableSkeleton rows={5} cols={6} />}

                {isError && (
                  <tbody>
                    <tr>
                      <td colSpan={6}>
                        <QueryError error={error} onRetry={refetch} />
                      </td>
                    </tr>
                  </tbody>
                )}

                {!isPending && !isError && (
                  <tbody className="divide-y divide-slate-100">
                    {recentDeliveries.map((d) => (
                      <tr key={d.id} className="transition-colors hover:bg-slate-50">
                        <td className="table-td font-medium text-slate-900">{d.id}</td>
                        <td className="table-td">{d.customer}</td>
                        <td className="table-td">{d.rider}</td>
                        <td className="table-td">{d.zone}</td>
                        <td className="table-td font-medium text-slate-900">{d.amount}</td>
                        <td className="table-td">
                          <span className={`badge ring-1 ring-inset ${statusStyles[d.status]}`}>{d.status}</span>
                        </td>
                      </tr>
                    ))}
                    {recentDeliveries.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                          No deliveries yet today.
                        </td>
                      </tr>
                    )}
                  </tbody>
                )}
              </table>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-900">Top riders today</h3>
            <span className="text-xs text-slate-400">{onlineRiders} online</span>
          </div>
          {isPending ? (
            <ul className="divide-y divide-slate-100">
              {Array.from({ length: 4 }, (_, index) => (
                <li key={index} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-slate-200" />
                  <span className="h-3.5 flex-1 animate-pulse rounded bg-slate-200" />
                </li>
              ))}
            </ul>
          ) : isError ? (
            <QueryError error={error} onRetry={refetch} />
          ) : (
            <ul className="divide-y divide-slate-100">
              {topRiders.map((r) => (
                <li key={r.name} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                    {r.name.split(' ').map((n) => n[0]).join('')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{r.name}</p>
                    <p className="text-xs text-slate-500">{r.zone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{r.deliveries}</p>
                    <p className="text-xs text-slate-400">drops</p>
                  </div>
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${r.online ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    aria-label={r.online ? 'Online' : 'Offline'}
                  />
                </li>
              ))}
              {topRiders.length === 0 && (
                <li className="px-5 py-10 text-center text-sm text-slate-500">No riders are active right now.</li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
