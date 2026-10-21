import { useState } from 'react'
import AddCustomerPanel from '../components/addCustomerPanel.jsx'
import ViewCustomerPanel from '../components/viewCustomerPanel.jsx'
import { QueryError, RefreshIndicator, TableSkeleton } from '../components/queryStates.jsx'
import { useCreateCustomer, useCustomers } from '../hooks/useCustomers.js'
import { useDebouncedValue } from '../hooks/useDebouncedValue.js'

const statusStyles = {
  Active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Inactive: 'bg-slate-100 text-slate-600 ring-slate-500/20',
}

const PAGE_SIZE = 8

function Customers() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [panelOpen, setPanelOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  const debouncedSearch = useDebouncedValue(search, 300)
  const params = { search: debouncedSearch, page, limit: PAGE_SIZE }

  const {
    data,
    isPending,
    isError,
    error,
    isFetching,
    isPlaceholderData,
    dataUpdatedAt,
    refetch,
  } = useCustomers(params)
  const createCustomer = useCreateCustomer()

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const onSearchChange = (e) => {
    setSearch(e.target.value)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Customers</h2>
          <p className="mt-1 text-sm text-slate-500">
            {isPending ? 'Loading accounts…' : `${total} registered account${total === 1 ? '' : 's'}`}
          </p>
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
              value={search}
              onChange={onSearchChange}
              placeholder="Search customers…"
              aria-label="Search customers"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:w-64"
            />
          </div>
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Add customer
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <RefreshIndicator isFetching={isFetching} updatedAt={dataUpdatedAt} onRefresh={refetch} />
        </div>
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

            {isPending && <TableSkeleton rows={PAGE_SIZE} cols={6} />}

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
                {items.map((c) => (
                  <tr
                    key={c.id}
                    className={`transition-colors hover:bg-slate-50 ${c.pending ? 'opacity-50' : ''}`}
                  >
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
                      <span className={`badge ring-1 ring-inset ${statusStyles[c.status]}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="table-td text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(c)
                          setViewOpen(true)
                        }}
                        className="font-semibold text-brand-600 hover:text-brand-700"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                      No customers match “{search}”.
                    </td>
                  </tr>
                )}
              </tbody>
            )}
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3.5">
          <p className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-700">{items.length}</span> of{' '}
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

      <AddCustomerPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onCreate={(payload) => createCustomer.mutateAsync(payload)}
      />
      <ViewCustomerPanel
        open={viewOpen}
        onClose={() => {
          setViewOpen(false)
          setSelectedCustomer(null)
        }}
        customer={selectedCustomer}
      />
    </div>
  )
}

export default Customers
