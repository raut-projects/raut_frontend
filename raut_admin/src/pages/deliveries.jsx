import { useMemo, useState } from 'react'

const deliveries = [
  { id: '#DLV-9041', customer: 'Maya Chen', rider: 'Daniel Okafor', zone: 'Downtown', amount: '$24.50', status: 'Delivered', date: 'Oct 19, 2026' },
  { id: '#DLV-9040', customer: 'Liam Torres', rider: 'Sofia Rossi', zone: 'Westside', amount: '$16.00', status: 'In transit', date: 'Oct 19, 2026' },
  { id: '#DLV-9039', customer: 'Emma Wilson', rider: 'Jonas Berg', zone: 'Midtown', amount: '$42.75', status: 'In transit', date: 'Oct 19, 2026' },
  { id: '#DLV-9038', customer: 'Noah Patel', rider: 'Aisha Bello', zone: 'Harbor', amount: '$9.25', status: 'Pending', date: 'Oct 19, 2026' },
  { id: '#DLV-9037', customer: 'Olivia Kim', rider: 'Marco Silva', zone: 'Eastend', amount: '$31.10', status: 'Delivered', date: 'Oct 19, 2026' },
  { id: '#DLV-9036', customer: 'Ethan Brown', rider: 'Priya Sharma', zone: 'Northgate', amount: '$12.80', status: 'Delivered', date: 'Oct 18, 2026' },
  { id: '#DLV-9035', customer: 'Ava Nguyen', rider: 'Tom Novak', zone: 'Southbank', amount: '$18.45', status: 'Cancelled', date: 'Oct 18, 2026' },
  { id: '#DLV-9034', customer: 'Lucas Silva', rider: 'Zoe Laurent', zone: 'Downtown', amount: '$27.60', status: 'Delivered', date: 'Oct 18, 2026' },
  { id: '#DLV-9033', customer: 'Maya Chen', rider: 'Daniel Okafor', zone: 'Downtown', amount: '$8.90', status: 'Delivered', date: 'Oct 18, 2026' },
  { id: '#DLV-9032', customer: 'Emma Wilson', rider: 'Sofia Rossi', zone: 'Westside', amount: '$54.20', status: 'In transit', date: 'Oct 18, 2026' },
  { id: '#DLV-9031', customer: 'Noah Patel', rider: 'Jonas Berg', zone: 'Midtown', amount: '$6.75', status: 'Pending', date: 'Oct 17, 2026' },
  { id: '#DLV-9030', customer: 'Olivia Kim', rider: 'Aisha Bello', zone: 'Harbor', amount: '$39.99', status: 'Delivered', date: 'Oct 17, 2026' },
  { id: '#DLV-9029', customer: 'Liam Torres', rider: 'Priya Sharma', zone: 'Northgate', amount: '$21.30', status: 'Delivered', date: 'Oct 17, 2026' },
  { id: '#DLV-9028', customer: 'Ava Nguyen', rider: 'Marco Silva', zone: 'Eastend', amount: '$14.05', status: 'Cancelled', date: 'Oct 17, 2026' },
  { id: '#DLV-9027', customer: 'Ethan Brown', rider: 'Zoe Laurent', zone: 'Downtown', amount: '$33.50', status: 'In transit', date: 'Oct 17, 2026' },
]

const statusStyles = {
  Delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  'In transit': 'bg-brand-50 text-brand-700 ring-brand-600/20',
  Pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Cancelled: 'bg-rose-50 text-rose-700 ring-rose-600/20',
}

function Deliveries() {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return deliveries
    return deliveries.filter(
      (d) =>
        d.id.toLowerCase().includes(q) ||
        d.customer.toLowerCase().includes(q) ||
        d.rider.toLowerCase().includes(q) ||
        d.zone.toLowerCase().includes(q)
    )
  }, [query])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Deliveries</h2>
          <p className="mt-1 text-sm text-slate-500">{deliveries.length} deliveries recorded</p>
        </div>
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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search orders, customers, riders…"
            aria-label="Search deliveries"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:w-72"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-card">
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
                <th className="table-th">Date</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((d) => (
                <tr key={d.id} className="transition-colors hover:bg-slate-50">
                  <td className="table-td font-medium text-slate-900">{d.id}</td>
                  <td className="table-td">{d.customer}</td>
                  <td className="table-td">{d.rider}</td>
                  <td className="table-td">{d.zone}</td>
                  <td className="table-td font-medium text-slate-900">{d.amount}</td>
                  <td className="table-td">
                    <span className={`badge ring-1 ring-inset ${statusStyles[d.status]}`}>{d.status}</span>
                  </td>
                  <td className="table-td">{d.date}</td>
                  <td className="table-td text-right">
                    <button type="button" className="font-semibold text-brand-600 hover:text-brand-700">
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">
                    No deliveries match “{query}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3.5">
          <p className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of{' '}
            <span className="font-semibold text-slate-700">{deliveries.length}</span>
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-400"
            >
              Previous
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Deliveries
