import { useMemo, useState } from "react";

const riders = [
  {
    id: 1,
    name: "Daniel Okafor",
    phone: "+1 (415) 555-0132",
    status: "Delivering",
    zone: "Downtown",
    deliveries: 18,
    rating: 4.9,
  },
  {
    id: 2,
    name: "Sofia Rossi",
    phone: "+1 (415) 555-0177",
    status: "Delivering",
    zone: "Westside",
    deliveries: 15,
    rating: 4.8,
  },
  {
    id: 3,
    name: "Jonas Berg",
    phone: "+1 (415) 555-0119",
    status: "Online",
    zone: "Midtown",
    deliveries: 12,
    rating: 4.7,
  },
  {
    id: 4,
    name: "Aisha Bello",
    phone: "+1 (415) 555-0164",
    status: "Offline",
    zone: "Harbor",
    deliveries: 9,
    rating: 4.9,
  },
  {
    id: 5,
    name: "Marco Silva",
    phone: "+1 (415) 555-0148",
    status: "Online",
    zone: "Eastend",
    deliveries: 7,
    rating: 4.6,
  },
  {
    id: 6,
    name: "Priya Sharma",
    phone: "+1 (415) 555-0193",
    status: "Delivering",
    zone: "Northgate",
    deliveries: 21,
    rating: 5.0,
  },
  {
    id: 7,
    name: "Tom Novak",
    phone: "+1 (415) 555-0155",
    status: "Offline",
    zone: "Southbank",
    deliveries: 4,
    rating: 4.4,
  },
  {
    id: 8,
    name: "Zoe Laurent",
    phone: "+1 (415) 555-0101",
    status: "Online",
    zone: "Downtown",
    deliveries: 11,
    rating: 4.8,
  },
];

const statusStyles = {
  Online: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Delivering: "bg-brand-50 text-brand-700 ring-brand-600/20",
  Offline: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const summary = [
  { label: "Online", value: 2, color: "text-emerald-600" },
  { label: "Delivering", value: 3, color: "text-brand-600" },
  { label: "Offline", value: 3, color: "text-slate-500" },
  { label: "Avg. rating", value: "4.8", color: "text-amber-500" },
];

function Riders() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return riders;
    return riders.filter(
      (r) =>
        r.name.toLowerCase().includes(q) || r.zone.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Riders
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {riders.length} riders on the fleet
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
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search riders or zones…"
              aria-label="Search riders"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:w-64"
            />
          </div>
          <button
            type="button"
            className="rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Add rider
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary.map((s) => (
          <div key={s.label} className="stat-card">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              {s.label}
            </p>
            <p className={'mt-1.5 text-2xl font-bold tracking-tight ${s.color}'}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-card">
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
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-slate-50">
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
              {filtered.length === 0 && (
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
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3.5">
          <p className="text-xs text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {filtered.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">
              {riders.length}
            </span>
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
  );
}

export default Riders;
