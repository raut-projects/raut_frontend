import { useState } from 'react'
import Checkbox from '../components/Checkbox.jsx'
import ViewCustomerPanel from '../components/viewCustomerPanel.jsx'
import { QueryError, RefreshIndicator, TableSkeleton } from '../components/queryStates.jsx'
import { ConfirmDialog, ReasonDialog, RoleDialog } from '../components/reasonDialog.jsx'
import { useCustomers } from '../hooks/useCustomers.js'
import { useDebouncedValue } from '../hooks/useDebouncedValue.js'
import {
  useDeactivateUser,
  useDeleteUser,
  useReactivateUser,
  useSetUserRole,
} from '../hooks/useAdminActions.js'

const statusStyles = {
  Active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Inactive: 'bg-slate-100 text-slate-600 ring-slate-500/20',
}

const roleStyles = {
  user: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  admin: 'bg-brand-50 text-brand-700 ring-brand-600/20',
  super_admin: 'bg-violet-50 text-violet-700 ring-violet-600/20',
}

const PAGE_SIZE = 8

const actionClass =
  'cursor-pointer font-semibold text-brand-600 transition-colors hover:text-brand-700 disabled:cursor-not-allowed disabled:text-slate-300'

function Customers() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [deactivateTarget, setDeactivateTarget] = useState(null)
  const [deactivateReason, setDeactivateReason] = useState('')
  const [roleTarget, setRoleTarget] = useState(null)
  const [roleValue, setRoleValue] = useState('user')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const debouncedSearch = useDebouncedValue(search, 300)
  const params = { search: debouncedSearch, status, page, limit: PAGE_SIZE }

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

  const deactivateUser = useDeactivateUser()
  const reactivateUser = useReactivateUser()
  const setUserRole = useSetUserRole()
  const deleteUser = useDeleteUser()

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const onSearchChange = (e) => {
    setSearch(e.target.value)
    setPage(1)
    setSelectedIds(new Set())
  }

  const onStatusChange = (e) => {
    setStatus(e.target.value)
    setPage(1)
    setSelectedIds(new Set())
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length && items.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map((c) => c.id)))
    }
  }

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Customers</h2>
          <p className="mt-1 text-sm text-slate-500">
            {isPending
              ? 'Loading accounts…'
              : status === 'all'
                ? `${total} registered account${total === 1 ? '' : 's'}`
                : `${total} ${status} account${total === 1 ? '' : 's'}`}
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
          <select
            value={status}
            onChange={onStatusChange}
            aria-label="Filter customers by status"
            className="rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option value="all">All accounts</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <RefreshIndicator isFetching={isFetching} updatedAt={dataUpdatedAt} onRefresh={refetch} />
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-600">
                {selectedIds.size} selected
              </span>
              <button
                type="button"
                onClick={() => setBulkDeleteOpen(true)}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={deleteUser.isPending}
              >
                Delete selected
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Clear
              </button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-th w-10">
                  <Checkbox
                    aria-label="Select all customers"
                    checked={items.length > 0 && selectedIds.size === items.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="table-th">Customer</th>
                <th className="table-th">Email</th>
                <th className="table-th">Orders</th>
                <th className="table-th">Joined</th>
                <th className="table-th">Role</th>
                <th className="table-th">Status</th>
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
                {items.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-slate-50">
                    <td className="table-td">
                      <Checkbox
                        aria-label={`Select ${c.name}`}
                        checked={selectedIds.has(c.id)}
                        onChange={() => toggleSelect(c.id)}
                      />
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                          </svg>
                        </span>
                        <span className="font-medium text-slate-900">{c.name}</span>
                      </div>
                    </td>
                    <td className="table-td">{c.email}</td>
                    <td className="table-td font-medium text-slate-900">{c.orders}</td>
                    <td className="table-td">{c.joined}</td>
                    <td className="table-td">
                      <span className={`badge capitalize ring-1 ring-inset ${roleStyles[c.role] ?? roleStyles.user}`}>
                        {c.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="table-td">
                      <span className={`badge ring-1 ring-inset ${statusStyles[c.status]}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="table-td">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomer(c)
                            setViewOpen(true)
                          }}
                          className={actionClass}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRoleValue(c.role)
                            setRoleTarget(c)
                          }}
                          className={actionClass}
                        >
                          Role
                        </button>
                        {c.isActive ? (
                          <button
                            type="button"
                            onClick={() => {
                              setDeactivateReason('')
                              setDeactivateTarget(c)
                            }}
                            className="cursor-pointer font-semibold text-rose-600 transition-colors hover:text-rose-700 disabled:cursor-not-allowed disabled:text-slate-300"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => reactivateUser.mutate({ userId: c.id })}
                            disabled={reactivateUser.isPending}
                            className={actionClass}
                          >
                            Reactivate
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(c)}
                          disabled={deleteUser.isPending}
                          className="cursor-pointer font-semibold text-rose-600 transition-colors hover:text-rose-700 disabled:cursor-not-allowed disabled:text-slate-300"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">
                      {search
                        ? `No customers match “${search}”.`
                        : status === 'all'
                          ? 'No customers yet.'
                          : `No ${status} customers.`}
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

      <ViewCustomerPanel
        open={viewOpen}
        onClose={() => {
          setViewOpen(false)
          setSelectedCustomer(null)
        }}
        customer={selectedCustomer}
      />

      <ReasonDialog
        open={Boolean(deactivateTarget)}
        onClose={() => setDeactivateTarget(null)}
        title="Deactivate account"
        description={
          deactivateTarget
            ? `${deactivateTarget.name} will no longer be able to sign in.`
            : undefined
        }
        confirmLabel="Deactivate"
        optional
        placeholder="Reason for deactivation (optional)…"
        value={deactivateReason}
        onChange={setDeactivateReason}
        pending={deactivateUser.isPending}
        onConfirm={async (reason) => {
          await deactivateUser.mutateAsync({ userId: deactivateTarget.id, reason })
          setDeactivateTarget(null)
        }}
      />

      <RoleDialog
        open={Boolean(roleTarget)}
        onClose={() => setRoleTarget(null)}
        value={roleValue}
        onChange={setRoleValue}
        pending={setUserRole.isPending}
        onConfirm={async (role) => {
          await setUserRole.mutateAsync({ userId: roleTarget.id, role })
          setRoleTarget(null)
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete account"
        description={
          deleteTarget
            ? `${deleteTarget.name} will be permanently deleted. This action cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        tone="danger"
        pending={deleteUser.isPending}
        onConfirm={async () => {
          await deleteUser.mutateAsync({ userId: deleteTarget.id })
          setDeleteTarget(null)
        }}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        title="Delete selected accounts"
        description={`You are about to permanently delete ${selectedIds.size} account${selectedIds.size === 1 ? '' : 's'}. This action cannot be undone.`}
        confirmLabel="Delete selected"
        tone="danger"
        pending={deleteUser.isPending}
        onConfirm={async () => {
          const ids = Array.from(selectedIds)
          await Promise.allSettled(ids.map((id) => deleteUser.mutateAsync({ userId: id })))
          setBulkDeleteOpen(false)
          setSelectedIds(new Set())
        }}
      />
    </div>
  )
}

export default Customers
