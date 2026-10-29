import { useState } from "react";
import {
  QueryError,
  RefreshIndicator,
  TableSkeleton,
} from "../components/queryStates";
import { ConfirmDialog, ReasonDialog } from "../components/reasonDialog";
import ViewDriverPanel from "../components/viewDriverPanel";
import { useDrivers } from "../hooks/useDrivers";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import {
  useDeleteUser,
  useRejectDriver,
  useSuspendDriver,
  useUnsuspendDriver,
  useVerifyDriver,
} from "../hooks/useAdminActions";

const statusStyles = {
  Verified: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Incomplete: "bg-brand-50 text-brand-700 ring-brand-600/20",
  Rejected: "bg-rose-50 text-rose-700 ring-rose-600/20",
  Suspended: "bg-rose-50 text-rose-700 ring-rose-600/20",
  "Not a driver": "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const statusDots = {
  Verified: "bg-emerald-500",
  Pending: "bg-amber-500",
  Incomplete: "bg-brand-500",
  Rejected: "bg-rose-500",
  Suspended: "bg-rose-500",
  "Not a driver": "bg-slate-400",
};

const PAGE_SIZE = 8;

const actionClass =
  "cursor-pointer font-semibold text-brand-600 transition-colors hover:text-brand-700 disabled:cursor-not-allowed disabled:text-slate-300";

const dangerClass =
  "cursor-pointer font-semibold text-rose-600 transition-colors hover:text-rose-700 disabled:cursor-not-allowed disabled:text-slate-300";

function Drivers() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [viewTarget, setViewTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const debouncedQuery = useDebouncedValue(query, 300);
  const params = { search: debouncedQuery, status, page, limit: PAGE_SIZE };

  const {
    data,
    isPending,
    isError,
    error,
    isFetching,
    isPlaceholderData,
    dataUpdatedAt,
    refetch,
  } = useDrivers(params);

  const verifyDriver = useVerifyDriver();
  const rejectDriver = useRejectDriver();
  const suspendDriver = useSuspendDriver();
  const unsuspendDriver = useUnsuspendDriver();
  const deleteUser = useDeleteUser();
  const deleteUserById = deleteUser.mutateAsync as unknown as (variables: {
    userId: string;
  }) => Promise<unknown>;

  const drivers = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const summary = data?.summary;

  const summaryCards = [
    {
      label: "Verified",
      value: summary?.verified ?? 0,
      color: "text-slate-900",
      status: "verified",
    },
    {
      label: "Pending",
      value: summary?.pending ?? 0,
      color: "text-slate-900",
      status: "pending",
    },
    {
      label: "Incomplete",
      value: summary?.incomplete ?? 0,
      color: "text-slate-900",
      status: "incomplete",
    },
    {
      label: "Total drivers",
      value: summary?.total ?? total,
      color: "text-slate-900",
      status: "all",
    },
  ];

  const onQueryChange = (e) => {
    setQuery(e.target.value);
    setPage(1);
    setSelectedIds(new Set());
  };

  const onStatusChange = (next) => {
    setStatus(next);
    setPage(1);
    setSelectedIds(new Set());
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === drivers.length && drivers.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(drivers.map((d) => d.id)));
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Drivers
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isPending
              ? "Loading fleet…"
              : status === "all"
                ? `${total} driver${total === 1 ? "" : "s"} on the fleet`
                : `${total} ${status} driver${total === 1 ? "" : "s"}`}
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              type="search"
              value={query}
              onChange={onQueryChange}
              placeholder="Search drivers…"
              aria-label="Search drivers"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:w-64"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((s) => {
          const active = status === s.status;
          return (
            <button
              key={s.label}
              type="button"
              onClick={() => onStatusChange(s.status)}
              aria-pressed={active}
              className={`cursor-pointer stat-card text-left transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
                active ? "ring-2 ring-brand-500" : "hover:shadow-md"
              }`}
            >
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                {s.label}
              </p>
              <p
                className={`mt-1.5 text-2xl font-bold tracking-tight ${s.color}`}
              >
                {s.value}
              </p>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <RefreshIndicator
            isFetching={isFetching}
            updatedAt={dataUpdatedAt}
            onRefresh={refetch}
          />
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
                  <input
                    type="checkbox"
                    aria-label="Select all drivers"
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    checked={
                      drivers.length > 0 && selectedIds.size === drivers.length
                    }
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="table-th">Driver</th>
                <th className="table-th">Phone</th>
                <th className="table-th">Status</th>
                <th className="table-th">Rides</th>
                <th className="table-th">Rating</th>
                <th className="table-th">Joined</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>

            {isPending && <TableSkeleton rows={PAGE_SIZE} cols={8} />}

            {isError && (
              <tbody>
                <tr>
                  <td colSpan={8}>
                    <QueryError error={error} onRetry={refetch} />
                  </td>
                </tr>
              </tbody>
            )}

            {!isPending && !isError && (
              <tbody className="divide-y divide-slate-100">
                {drivers.map((r) => (
                  <tr
                    key={r.id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="table-td">
                      <input
                        type="checkbox"
                        aria-label={`Select ${r.name}`}
                        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        checked={selectedIds.has(r.id)}
                        onChange={() => toggleSelect(r.id)}
                      />
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
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
                        <span className="font-medium text-slate-900">
                          {r.name}
                        </span>
                      </div>
                    </td>
                    <td className="table-td">{r.phone}</td>
                    <td className="table-td">
                      <span
                        className={`badge ring-1 ring-inset ${statusStyles[r.status] ?? statusStyles["Not a driver"]}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${statusDots[r.status] ?? statusDots["Not a driver"]}`}
                          aria-hidden="true"
                        />
                        {r.status}
                      </span>
                    </td>
                    <td className="table-td font-medium text-slate-900">
                      {r.rides}
                    </td>
                    <td className="table-td">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-900">
                        <svg
                          className="h-4 w-4 text-amber-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {r.rating.toFixed(1)}
                      </span>
                    </td>
                    <td className="table-td">{r.joined}</td>
                    <td className="table-td">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setViewTarget(r)}
                          className={actionClass}
                        >
                          View
                        </button>
                        {r.statusKey === "pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                (
                                  verifyDriver.mutate as unknown as (variables: {
                                    driverId: typeof r.id;
                                  }) => void
                                )({ driverId: r.id })
                              }
                              disabled={verifyDriver.isPending}
                              className={actionClass}
                            >
                              Verify
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectReason("");
                                setRejectTarget(r);
                              }}
                              className={dangerClass}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {r.statusKey === "verified" && (
                          <button
                            type="button"
                            onClick={() => {
                              setSuspendReason("");
                              setSuspendTarget(r);
                            }}
                            className={dangerClass}
                          >
                            Suspend
                          </button>
                        )}
                        {r.statusKey === "suspended" && (
                          <button
                            type="button"
                            onClick={() => unsuspendDriver.mutate()}
                            disabled={unsuspendDriver.isPending}
                            className={actionClass}
                          >
                            Unsuspend
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(r)}
                          disabled={deleteUser.isPending}
                          className={dangerClass}
                        >
                          Delete
                        </button>
                        {(r.statusKey === "incomplete" ||
                          r.statusKey === "none") && (
                          <span className="text-xs text-slate-400">
                            No action
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {drivers.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      No drivers match “{query}”.
                    </td>
                  </tr>
                )}
              </tbody>
            )}
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3.5">
          <p className="text-xs text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {drivers.length}
            </span>{" "}
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

      <ViewDriverPanel
        open={Boolean(viewTarget)}
        onClose={() => setViewTarget(null)}
        driver={viewTarget}
      />

      <ReasonDialog
        open={Boolean(rejectTarget)}
        children={null}
        onClose={() => setRejectTarget(null)}
        title="Reject driver application"
        description={
          rejectTarget
            ? `${rejectTarget.name} will not be able to take rides.`
            : undefined
        }
        confirmLabel="Reject"
        tone="danger"
        placeholder="Why is the application rejected?"
        value={rejectReason}
        onChange={setRejectReason}
        pending={rejectDriver.isPending}
        onConfirm={async (reason) => {
          await (
            rejectDriver.mutateAsync as unknown as (variables: {
              driverId: string;
              reason: string;
            }) => Promise<unknown>
          )({ driverId: rejectTarget.id, reason });
          setRejectTarget(null);
        }}
      />

      <ReasonDialog
        open={Boolean(suspendTarget)}
        children={null}
        onClose={() => setSuspendTarget(null)}
        title="Suspend driver"
        description={
          suspendTarget
            ? `${suspendTarget.name} will be taken off the road.`
            : undefined
        }
        confirmLabel="Suspend"
        tone="danger"
        placeholder="Why is the driver suspended?"
        value={suspendReason}
        onChange={setSuspendReason}
        pending={suspendDriver.isPending}
        onConfirm={async (reason) => {
          await (
            suspendDriver.mutateAsync as unknown as (variables: {
              driverId: string;
              reason: string;
            }) => Promise<unknown>
          )({
            driverId: suspendTarget.id,
            reason,
          });
          setSuspendTarget(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        children={null}
        onClose={() => setDeleteTarget(null)}
        title="Delete driver account"
        description={
          deleteTarget
            ? `${deleteTarget.name} will be permanently deleted. This action cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        tone="danger"
        pending={deleteUser.isPending}
        onConfirm={async () => {
          await deleteUserById({ userId: deleteTarget.id });
          setDeleteTarget(null);
        }}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        children={null}
        onClose={() => setBulkDeleteOpen(false)}
        title="Delete selected drivers"
        description={`You are about to permanently delete ${selectedIds.size} driver${selectedIds.size === 1 ? "" : "s"}. This action cannot be undone.`}
        confirmLabel="Delete selected"
        tone="danger"
        pending={deleteUser.isPending}
        onConfirm={async () => {
          const ids = Array.from(selectedIds);
          await Promise.allSettled(
            ids.map((id) => deleteUserById({ userId: id })),
          );
          setBulkDeleteOpen(false);
          setSelectedIds(new Set());
        }}
      />
    </div>
  );
}

export default Drivers;
