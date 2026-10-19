const stats = [
  { label: 'Total Customers', value: '2,847', delta: '+12.4%', up: true, hint: 'vs. last month' },
  { label: 'Active Riders', value: '164', delta: '+4 this week', up: true, hint: 'of 189 registered' },
  { label: 'Deliveries Today', value: '1,092', delta: '+8.2%', up: true, hint: 'vs. yesterday' },
  { label: 'Revenue Today', value: '$18,420', delta: '-2.1%', up: false, hint: 'vs. yesterday' },
]

const deliveries = [
  { id: '#DLV-9041', customer: 'Maya Chen', rider: 'Daniel Okafor', zone: 'Downtown', amount: '$24.50', status: 'Delivered' },
  { id: '#DLV-9040', customer: 'Liam Torres', rider: 'Sofia Rossi', zone: 'Westside', amount: '$16.00', status: 'In transit' },
  { id: '#DLV-9039', customer: 'Emma Wilson', rider: 'Jonas Berg', zone: 'Midtown', amount: '$42.75', status: 'In transit' },
  { id: '#DLV-9038', customer: 'Noah Patel', rider: 'Aisha Bello', zone: 'Harbor', amount: '$9.25', status: 'Pending' },
  { id: '#DLV-9037', customer: 'Olivia Kim', rider: 'Marco Silva', zone: 'Eastend', amount: '$31.10', status: 'Delivered' },
]

const statusStyles = {
  Delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  'In transit': 'bg-brand-50 text-brand-700 ring-brand-600/20',
  Pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
}

const riderSummary = [
  { name: 'Daniel Okafor', zone: 'Downtown', deliveries: 18, online: true },
  { name: 'Sofia Rossi', zone: 'Westside', deliveries: 15, online: true },
  { name: 'Jonas Berg', zone: 'Midtown', deliveries: 12, online: true },
  { name: 'Aisha Bello', zone: 'Harbor', deliveries: 9, online: false },
]

function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back, Alex</h2>
        <p className="mt-1 text-sm text-slate-500">Here is what is happening with Rout today.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{stat.value}</p>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs">
              <span className={`font-semibold ${stat.up ? 'text-emerald-600' : 'text-rose-600'}`}>{stat.delta}</span>
              <span className="text-slate-400">{stat.hint}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-900">Recent deliveries</h3>
              <button type="button" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                View all
              </button>
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
                <tbody className="divide-y divide-slate-100">
                  {deliveries.map((d) => (
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
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-900">Top riders today</h3>
            <span className="text-xs text-slate-400">4 online</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {riderSummary.map((r) => (
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
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
