import { useState } from "react";
import AddRiderPanel from "../components/addRiderPanel.jsx";
import {
  QueryError,
  RefreshIndicator,
  TableSkeleton,
} from "../components/queryStates.jsx";
import { useCreateRider, useRiders } from "../hooks/useRiders.js";
import { useDebouncedValue } from "../hooks/useDebouncedValue.js";

const statusStyles = {
  Online: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Delivering: "bg-brand-50 text-brand-700 ring-brand-600/20",
  Offline: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const PAGE_SIZE = 8;

const placeholderSummary = [
  { label: "Online", value: "—", color: "text-slate-300" },
  { label: "Delivering", value: "—", color: "text-slate-300" },
  { label: "Offline", value: "—", color: "text-slate-300" },
  { label: "Avg. rating", value: "—", color: "text-slate-300" },
];

function Riders() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [panelOpen, setPanelOpen] = useState(false);

  const debouncedQuery = useDebouncedValue(query, 300);
  const params = { search: debouncedQuery, page, limit: PAGE_SIZE };

  const {
    data,
    isPending,
    isError,
    error,
    isFetching,
    isPlaceholderData,
    dataUpdatedAt,
    refetch,
  } = useRiders(params);
  const createRider = useCreateRider();

  const riders = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const summary = data?.summary ?? [];
  const summaryCards = summary.length > 0 ? summary : placeholderSummary;

  const onQueryChange = (e) => {
    setQuery(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Riders
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isPending ? "Loading fleet…" : `${total} rider${total === 1 ? "" : "s"} on the fleet`}
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
              placeholder="Search riders or zones…"
              aria-label="Search riders"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:w-64"
            />
          </div>
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Add rider
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((s) => (
          <div key={s.label} className="stat-card">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              {s.label}
            </p>
            <p className={`mt-1.5 text-2xl font-bold tracking-tight ${s.color}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <RefreshIndicator
            isFetching={isFetching}
            updatedAt={dataUpdatedAt}
            onRefresh={refetch}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-th">Rider</th>
                <th className="table-th">Phone</th>
                <th className="table-th">Status</th>
                <th className="table-th">Zone</th>
                <th className="table-th">Deliveries</th>
                <th className="table-th">Rating</th>
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
                {riders.map((r) => (
                  <tr
                    key={r.id}
                    className={`transition-colors hover:bg-slate-50 ${
                      r.pending ? "opacity-50" : ""
                    }`}
                  >
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                          {r.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                        <span className="font-medium text-slate-900">
                          {r.name}
                        </span>
                      </div>
                    </td>
                    <td className="table-td">{r.phone}</td>
                    <td className="table-td">
                      <span
                        className={`badge ring-1 ring-inset ${statusStyles[r.status]}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            r.status === "Online"
                              ? "bg-emerald-500"
                              : r.status === "Delivering"
                                ? "bg-brand-500"
                                : "bg-slate-400"
                          }`}
                          aria-hidden="true"
                        />
                        {r.status}
                      </span>
                    </td>
                    <td className="table-td">{r.zone}</td>
                    <td className="table-td font-medium text-slate-900">
                      {r.deliveries}
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
                    <td className="table-td text-right">
                      <button
                        type="button"
                        className="font-semibold text-brand-600 hover:text-brand-700"
                      >
                        Message
                      </button>
                    </td>
                  </tr>
                ))}
                {riders.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      No riders match “{query}”.
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
            <span className="font-semibold text-slate-700">{riders.length}</span> of{" "}
            <span className="font-semibold text-slate-700">{total}</span>
            {totalPages > 1 && (
              <>
                {" "}
                · Page{" "}
                <span className="font-semibold text-slate-700">{page}</span> of{" "}
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

      <AddRiderPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onCreate={(payload) => createRider.mutateAsync(payload)}
      />
    </div>
  );
}

export default Riders;
