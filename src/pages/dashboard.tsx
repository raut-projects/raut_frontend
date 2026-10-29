import { QueryError, RefreshIndicator, TableSkeleton } from '../components/queryStates'
import { useDashboard } from '../hooks/useDashboard'
import { useSession } from '../hooks/useSession'
import { formatMoney } from '../services/mappers'

const statusStyles = {
  Delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  'In transit': 'bg-brand-50 text-brand-700 ring-brand-600/20',
  Pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Cancelled: 'bg-rose-50 text-rose-700 ring-rose-600/20',
}

const statIcons = {
  users: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  truck: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  ),
  route: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
    </svg>
  ),
  currency: (
    <svg width="24px" height="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="feather feather-dollar-sign">
      <line x1="12" y1="1" x2="12" y2="23"></line>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
</svg>

  ),
}

function Dashboard() {
  const { data, isPending, isError, error, isFetching, dataUpdatedAt, refetch } = useDashboard()
  const session = useSession()
  const firstName = session?.name?.split(' ')[0] ?? 'there'

  const stats = data?.stats ?? []
  const recentDeliveries = data?.recentDeliveries ?? []
  const topDrivers = data?.topDrivers ?? []
  const verifiedDrivers = data?.verifiedDrivers ?? 0
  const overview = data?.overview
  const ridesAnalytics = data?.ridesAnalytics ?? []
  const revenueAnalytics = data?.revenueAnalytics ?? []
  const driversAnalytics = data?.driversAnalytics
  const peakHours = data?.peakHours ?? []

  const getStatIcon = (label) => {
    const l = label.toLowerCase()
    if (l.includes('customer')) return statIcons.users
    if (l.includes('driver')) return statIcons.truck
    if (l.includes('ride') || l.includes('delivery')) return statIcons.route
    if (l.includes('revenue') || l.includes('amount')) return statIcons.currency
    return statIcons.users
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back, {firstName}</h2>
          <p className="mt-1 text-sm text-slate-500">Here's what's happening with your platform today.</p>
        </div>
        <RefreshIndicator isFetching={isFetching} updatedAt={dataUpdatedAt} onRefresh={refetch} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isPending &&
          Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="stat-card">
              <div className="flex items-center justify-between">
                <span className="block h-3.5 w-24 animate-pulse rounded bg-slate-200" />
                <span className="block h-9 w-9 animate-pulse rounded-xl bg-slate-200" />
              </div>
              <span className="mt-3 block h-7 w-16 animate-pulse rounded bg-slate-200" />
              <span className="mt-2 block h-3 w-28 animate-pulse rounded bg-slate-200" />
            </div>
          ))}

        {!isPending &&
          !isError &&
          stats.map((stat) => (
            <div key={stat.label} className="stat-card group">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 text-slate-700 transition-transform group-hover:scale-110">
                  {getStatIcon(stat.label)}
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{stat.value}</p>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs">
                <span className={`font-semibold ${stat.up ? 'text-emerald-600' : 'text-rose-600'}`}>{stat.delta}</span>
                <span className="text-slate-400">{stat.hint}</span>
              </p>
            </div>
          ))}

        {isError && (
          <div className="sm:col-span-2 xl:col-span-4">
            <div className="card">
              <QueryError error={error} onRetry={refetch} />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="card overflow-hidden">
            <div className="card-header">
              <h3 className="text-base font-semibold text-slate-900">Recent deliveries</h3>
              <button className="text-sm font-medium text-brand-600 hover:text-brand-700">View all</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="table-th">Order</th>
                    <th className="table-th">Customer</th>
                    <th className="table-th">Driver</th>
                    <th className="table-th">Route</th>
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
                      <tr key={d.id} className="transition-colors hover:bg-slate-50/50">
                        <td className="table-td font-medium text-slate-900">{d.id}</td>
                        <td className="table-td">{d.customer}</td>
                        <td className="table-td">{d.driver}</td>
                        <td className="table-td">{d.route}</td>
                        <td className="table-td font-medium text-slate-900">{d.amount}</td>
                        <td className="table-td">
                          <span className={`badge ${statusStyles[d.status]}`}>{d.status}</span>
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

        <div className="card overflow-hidden">
          <div className="card-header">
            <h3 className="text-base font-semibold text-slate-900">Top drivers</h3>
            <span className="text-xs font-medium text-slate-400">{verifiedDrivers} verified</span>
          </div>
          {isPending ? (
            <ul className="divide-y divide-slate-100">
              {Array.from({ length: 4 }, (_, index) => (
                <li key={index} className="flex items-center gap-3 px-6 py-3.5">
                  <span className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <span className="block h-3.5 w-24 animate-pulse rounded bg-slate-200" />
                    <span className="block h-3 w-16 animate-pulse rounded bg-slate-200" />
                  </div>
                </li>
              ))}
            </ul>
          ) : isError ? (
            <QueryError error={error} onRetry={refetch} />
          ) : (
            <ul className="divide-y divide-slate-100">
              {topDrivers.map((r) => (
                <li key={r.id ?? r.name} className="flex items-center gap-3 px-6 py-3.5 transition-colors hover:bg-slate-50/50">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{r.name}</p>
                    <p className="text-xs text-slate-500">{r.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{r.rides}</p>
                    <p className="text-xs text-slate-400">rides</p>
                  </div>
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${r.active ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-slate-300'}`}
                    aria-label={r.active ? 'Verified' : 'Not verified'}
                  />
                </li>
              ))}
              {topDrivers.length === 0 && (
                <li className="px-6 py-10 text-center text-sm text-slate-500">No drivers are active right now.</li>
              )}
            </ul>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="card-header">
            <h3 className="text-base font-semibold text-slate-900">Rides analytics</h3>
            <span className="text-xs font-medium text-slate-400">/admin/analytics/rides</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="table-th">Period</th>
                  <th className="table-th">Total rides</th>
                  <th className="table-th">Completed</th>
                  <th className="table-th">Cancelled</th>
                </tr>
              </thead>
              {isPending && <TableSkeleton rows={5} cols={4} />}
              {!isPending && !isError && (
                <tbody className="divide-y divide-slate-100">
                  {ridesAnalytics.slice(0, 10).map((row: any, idx: number) => (
                    <tr key={idx} className="transition-colors hover:bg-slate-50/50">
                      <td className="table-td">{row.period}</td>
                      <td className="table-td font-medium text-slate-900">{row.totalRides}</td>
                      <td className="table-td">{row.completed}</td>
                      <td className="table-td">{row.cancelled}</td>
                    </tr>
                  ))}
                  {ridesAnalytics.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                        No rides analytics data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              )}
            </table>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="card-header">
            <h3 className="text-base font-semibold text-slate-900">Revenue analytics</h3>
            <span className="text-xs font-medium text-slate-400">/admin/analytics/revenue</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="table-th">Period</th>
                  <th className="table-th">Revenue</th>
                </tr>
              </thead>
              {isPending && <TableSkeleton rows={5} cols={2} />}
              {!isPending && !isError && (
                <tbody className="divide-y divide-slate-100">
                  {revenueAnalytics.slice(0, 10).map((row: any, idx: number) => (
                    <tr key={idx} className="transition-colors hover:bg-slate-50/50">
                      <td className="table-td">{row.period}</td>
                      <td className="table-td font-medium text-slate-900">{formatMoney(row.totalRevenue)}</td>
                    </tr>
                  ))}
                  {revenueAnalytics.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center text-sm text-slate-500">
                        No revenue analytics data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              )}
            </table>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="card-header">
            <h3 className="text-base font-semibold text-slate-900">Drivers analytics</h3>
            <span className="text-xs font-medium text-slate-400">/admin/analytics/drivers</span>
          </div>
          <div className="p-6">
            {isPending ? (
              <div className="space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
              </div>
            ) : driversAnalytics && typeof driversAnalytics === 'object' ? (
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(driversAnalytics).slice(0, 8).map(([key, value]: any) => (
                  <div key={key} className="rounded-lg border border-slate-100 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">{key.replace(/_/g, ' ')}</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{typeof value === 'number' ? value : JSON.stringify(value)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No drivers analytics data available.</p>
            )}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="card-header">
            <h3 className="text-base font-semibold text-slate-900">Peak hours</h3>
            <span className="text-xs font-medium text-slate-400">/admin/analytics/peak-hours</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="table-th">Hour</th>
                  <th className="table-th">Rides</th>
                </tr>
              </thead>
              {isPending && <TableSkeleton rows={5} cols={2} />}
              {!isPending && !isError && (
                <tbody className="divide-y divide-slate-100">
                  {peakHours.slice(0, 24).map((row: any, idx: number) => (
                    <tr key={idx} className="transition-colors hover:bg-slate-50/50">
                      <td className="table-td">{row.hour}</td>
                      <td className="table-td font-medium text-slate-900">{row.rides}</td>
                    </tr>
                  ))}
                  {peakHours.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center text-sm text-slate-500">
                        No peak hours data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              )}
            </table>
          </div>
        </div>
      </div>

      {overview && typeof overview === 'object' && (
        <div className="card overflow-hidden">
          <div className="card-header">
            <h3 className="text-base font-semibold text-slate-900">Overview analytics</h3>
            <span className="text-xs font-medium text-slate-400">/admin/analytics/overview</span>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {Object.entries(overview).slice(0, 12).map(([key, value]: any) => (
                <div key={key} className="rounded-lg border border-slate-100 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{key.replace(/_/g, ' ')}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {typeof value === 'number' && key.includes('revenue') ? formatMoney(value) : typeof value === 'number' ? value : JSON.stringify(value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
