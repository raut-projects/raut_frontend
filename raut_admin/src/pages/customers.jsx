import { useMemo, useState } from 'react'

const customers = [
  { id: 1, name: 'Maya Chen', email: 'maya.chen@example.com', orders: 42, joined: 'Jan 12, 2025', status: 'Active' },
  { id: 2, name: 'Liam Torres', email: 'liam.torres@example.com', orders: 17, joined: 'Feb 3, 2025', status: 'Active' },
  { id: 3, name: 'Emma Wilson', email: 'emma.wilson@example.com', orders: 89, joined: 'Nov 21, 2024', status: 'Active' },
  { id: 4, name: 'Noah Patel', email: 'noah.patel@example.com', orders: 5, joined: 'Aug 7, 2025', status: 'Inactive' },
  { id: 5, name: 'Olivia Kim', email: 'olivia.kim@example.com', orders: 63, joined: 'Sep 30, 2024', status: 'Active' },
  { id: 6, name: 'Ethan Brown', email: 'ethan.brown@example.com', orders: 28, joined: 'Mar 18, 2025', status: 'Active' },
  { id: 7, name: 'Ava Nguyen', email: 'ava.nguyen@example.com', orders: 11, joined: 'Jun 2, 2025', status: 'Inactive' },
  { id: 8, name: 'Lucas Silva', email: 'lucas.silva@example.com', orders: 54, joined: 'Dec 9, 2024', status: 'Active' },
]

const statusStyles = {
  Active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Inactive: 'bg-slate-100 text-slate-600 ring-slate-500/20',
}

function Customers() {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
  }, [query])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Customers</h2>
          <p className="mt-1 text-sm text-slate-500">{customers.length} registered accounts</p>
        </div>
        <div className="flex items-center gap-3">
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
              placeholder="Search customers…"
              aria-label="Search customers"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:w-64"
            />
          </div>
          <button
            type="button"
            className="rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Add customer
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-th">Customer</th>
                <th className="table-th">Email</th>
                <th className="table-th">Orders</th>
                <th className="table-th">Joined</th>
                <th className="table-th">Status</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-slate-50">
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                        {c.name.split(' ').map((n) => n[0]).join('')}
                      </span>
                      <span className="font-medium text-slate-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="table-td">{c.email}</td>
                  <td className="table-td font-medium text-slate-900">{c.orders}</td>
                  <td className="table-td">{c.joined}</td>
                  <td className="table-td">
                    <span className={`badge ring-1 ring-inset ${statusStyles[c.status]}`}>{c.status}</span>
                  </td>
                  <td className="table-td text-right">
                    <button type="button" className="font-semibold text-brand-600 hover:text-brand-700">
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    No customers match “{query}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3.5">
          <p className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of{' '}
            <span className="font-semibold text-slate-700">{customers.length}</span>
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

export default Customers
