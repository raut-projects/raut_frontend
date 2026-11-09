"use client";

import { useState } from "react";
import { EllipsisVertical } from "lucide-react";
import ViewCustomerPanel from "@/components/viewCustomerPanel";
import { FilterStatCards } from "@/components/FilterStatCards";
import {
  QueryError,
  RefreshIndicator,
  TableSkeleton,
} from "@/components/queryStates";
import {
  ConfirmDialog,
  ReasonDialog,
  RoleDialog,
} from "@/components/reasonDialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCustomerStats, useCustomers } from "@/hooks/useCustomers";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  useDeactivateUser,
  useDeleteUser,
  useReactivateUser,
  useSetUserRole,
} from "@/hooks/useAdminActions";
import { usePageViewField } from "@/store/pageViewStore";
import { useClampPage } from "@/hooks/useClampPage";

const statusStyles = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Inactive: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const roleStyles = {
  user: "bg-slate-100 text-slate-600 ring-slate-500/20",
  admin: "bg-brand-50 text-brand-700 ring-brand-600/20",
  super_admin: "bg-violet-50 text-violet-700 ring-violet-600/20",
};

const PAGE_SIZE = 8;

function Customers() {
  const [search, setSearch] = usePageViewField("customers", "search");
  const [status, setStatus] = usePageViewField("customers", "status");
  const [page, setPage] = usePageViewField("customers", "page");
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [roleTarget, setRoleTarget] = useState(null);
  const [roleValue, setRoleValue] = useState("user");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 300);
  const params = { search: debouncedSearch, status, page, limit: PAGE_SIZE };

  const {
    data,
    isPending,
    isError,
    error,
    isFetching,
    isPlaceholderData,
    dataUpdatedAt,
    refetch,
  } = useCustomers(params);
  const customerStatsQuery = useCustomerStats();

  const deactivateUser = useDeactivateUser();
  const reactivateUser = useReactivateUser();
  const setUserRole = useSetUserRole();
  const deleteUser = useDeleteUser();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const fallbackCustomerStats = items.reduce(
    (stats, customer) => {
      if (customer.isActive) stats.active += 1;
      else stats.inactive += 1;
      return stats;
    },
    { total: items.length, active: 0, inactive: 0 },
  );
  const customerStats =
    customerStatsQuery.data ??
    (customerStatsQuery.isError ? fallbackCustomerStats : null);

  useClampPage(page, totalPages, setPage);

  const onStatusSelect = (nextStatus) => {
    setStatus(nextStatus);
    setPage(1);
    setSelectedIds(new Set());
  };

  const onSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
    setSelectedIds(new Set());
  };

  const onStatusChange = (e) => onStatusSelect(e.target.value);

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length && items.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((c) => c.id)));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const openCustomer = (customer) => {
    setSelectedCustomer(customer);
    setViewOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Customers
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isPending
              ? "Loading accounts…"
              : status === "all"
                ? `${total} registered account${total === 1 ? "" : "s"}`
                : `${total} ${status} account${total === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-auto">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
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
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:w-auto"
          >
            <option value="all">All accounts</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </div>
      </div>

      <FilterStatCards
        columns="three"
        selectedFilter={status}
        onSelect={onStatusSelect}
        isLoading={customerStatsQuery.isPending && !customerStats}
        partialMessage={
          customerStatsQuery.isError && !customerStatsQuery.data
            ? "Global statistics are unavailable. Counts show the current page with its active filters."
            : undefined
        }
        cards={[
          {
            label: "All customers",
            value: customerStats?.total ?? null,
            filter: "all",
          },
          {
            label: "Active",
            value: customerStats?.active ?? null,
            filter: "active",
          },
          {
            label: "Inactive",
            value: customerStats?.inactive ?? null,
            filter: "inactive",
          },
        ]}
      />

      <div className="rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 sm:px-5">
          <RefreshIndicator
            isFetching={isFetching || customerStatsQuery.isFetching}
            updatedAt={Math.max(dataUpdatedAt, customerStatsQuery.dataUpdatedAt)}
            onRefresh={() => {
              void refetch();
              void customerStatsQuery.refetch();
            }}
          />
          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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
        <Table className="min-w-full">
          <TableHeader className="bg-slate-50 [&_tr]:border-slate-200">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10">
                <Checkbox
                  aria-label="Select all customers"
                  className="border-slate-300 focus-visible:ring-brand-500"
                  checked={
                    items.length > 0 && selectedIds.size === items.length
                  }
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden lg:table-cell">Email</TableHead>
              <TableHead className="hidden lg:table-cell">Orders</TableHead>
              <TableHead className="hidden xl:table-cell">Joined</TableHead>
              <TableHead className="hidden lg:table-cell">Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          {isPending && (
            <TableSkeleton
              rows={PAGE_SIZE}
              cols={8}
              mobileCols={4}
              lgCols={7}
            />
          )}

          {isError && (
            <TableBody>
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="p-0">
                  <QueryError error={error} onRetry={refetch} />
                </TableCell>
              </TableRow>
            </TableBody>
          )}

          {!isPending && !isError && (
            <TableBody>
              {items.map((c) => (
                <TableRow
                  key={c.id}
                  onClick={() => openCustomer(c)}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openCustomer(c);
                    }
                  }}
                  tabIndex={0}
                  className="cursor-pointer focus-visible:outline-2 focus-visible:outline-brand-600"
                >
                  <TableCell onClick={(event) => event.stopPropagation()}>
                    <Checkbox
                      aria-label={`Select ${c.name}`}
                      className="border-slate-300 focus-visible:ring-brand-500"
                      checked={selectedIds.has(c.id)}
                      onCheckedChange={() => toggleSelect(c.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 sm:flex sm:h-10 sm:w-10">
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                          />
                        </svg>
                      </span>
                      <span className="max-w-[5rem] truncate font-medium text-slate-900 sm:max-w-[8rem] lg:max-w-none">
                        {c.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden max-w-[8rem] truncate lg:table-cell">
                    {c.email}
                  </TableCell>
                  <TableCell className="hidden font-medium text-slate-900 lg:table-cell">
                    {c.orders}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    {c.joined}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span
                      className={`badge capitalize ring-1 ring-inset ${roleStyles[c.role] ?? roleStyles.user}`}
                    >
                      {c.role.replace("_", " ")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`badge ring-1 ring-inset ${statusStyles[c.status]}`}
                    >
                      {c.status}
                    </span>
                  </TableCell>
                  <TableCell
                    className="text-right"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                          aria-label={`Actions for ${c.name}`}
                        >
                          <EllipsisVertical
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-elevated ring-0"
                      >
                        <DropdownMenuItem
                          onSelect={() => openCustomer(c)}
                          className="px-2.5 py-1.5 text-xs font-medium text-slate-600 focus:bg-slate-50 focus:text-slate-700"
                        >
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => {
                            setRoleValue(c.role);
                            setRoleTarget(c);
                          }}
                          className="px-2.5 py-1.5 text-xs font-medium text-slate-600 focus:bg-slate-50 focus:text-slate-700"
                        >
                          Change role
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-100" />
                        {c.isActive ? (
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => {
                              setDeactivateReason("");
                              setDeactivateTarget(c);
                            }}
                            className="px-2.5 py-1.5 text-xs font-medium"
                          >
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onSelect={() => reactivateUser.mutate()}
                            disabled={reactivateUser.isPending}
                            className="px-2.5 py-1.5 text-xs font-medium text-slate-600 focus:bg-slate-50 focus:text-slate-700"
                          >
                            Reactivate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setDeleteTarget(c)}
                          disabled={deleteUser.isPending}
                          className="px-2.5 py-1.5 text-xs font-medium"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={8}
                    className="py-10 text-center text-slate-500"
                  >
                    {search
                      ? `No customers match “${search}”.`
                      : status === "all"
                        ? "No customers yet."
                        : `No ${status} customers.`}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          )}
        </Table>
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3.5">
          <p className="text-xs text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">{items.length}</span>{" "}
            of <span className="font-semibold text-slate-700">{total}</span>
            {totalPages > 1 && (
              <>
                {" "}
                · Page{" "}
                <span className="font-semibold text-slate-700">
                  {page}
                </span> of{" "}
                <span className="font-semibold text-slate-700">
                  {totalPages}
                </span>
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
          setViewOpen(false);
          setSelectedCustomer(null);
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
        tone="danger"
        optional
        placeholder="Reason for deactivation (optional)…"
        value={deactivateReason}
        onChange={setDeactivateReason}
        pending={deactivateUser.isPending}
        onConfirm={async () => {
          await deactivateUser.mutateAsync();
          setDeactivateTarget(null);
        }}
      />

      <RoleDialog
        open={Boolean(roleTarget)}
        onClose={() => setRoleTarget(null)}
        value={roleValue}
        onChange={setRoleValue}
        pending={setUserRole.isPending}
        onConfirm={async (role) => {
          await setUserRole.mutateAsync({
            userId: roleTarget.id,
            role,
          } as never);
          setRoleTarget(null);
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
          await deleteUser.mutateAsync();
          setDeleteTarget(null);
        }}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        title="Delete selected accounts"
        description={`You are about to permanently delete ${selectedIds.size} account${selectedIds.size === 1 ? "" : "s"}. This action cannot be undone.`}
        confirmLabel="Delete selected"
        tone="danger"
        pending={deleteUser.isPending}
        onConfirm={async () => {
          const ids = Array.from(selectedIds);
          await Promise.allSettled(
            ids.map((id) => deleteUser.mutateAsync({ userId: id } as never)),
          );
          setBulkDeleteOpen(false);
          setSelectedIds(new Set());
        }}
      />
    </div>
  );
}

export default Customers;
