"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EllipsisVertical, Search } from "lucide-react";
import {
  QueryError,
  RefreshIndicator,
  TableSkeleton,
} from "@/components/queryStates";
import { FilterStatCards } from "@/components/FilterStatCards";
import { ConfirmDialog, ReasonDialog } from "@/components/reasonDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAllDrivers } from "@/hooks/useDrivers";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePendingPayouts } from "@/hooks/usePayouts";
import {
  useDeleteUser,
  useRejectDriver,
  useSuspendDriver,
  useUnsuspendDriver,
  useVerifyDriver,
} from "@/hooks/useAdminActions";
import { usePageViewField } from "@/store/pageViewStore";
import { useClampPage } from "@/hooks/useClampPage";

const statusStyles = {
  Verified: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Incomplete: "bg-brand-50 text-brand-700 ring-brand-600/20",
  Rejected: "bg-rose-50 text-rose-700 ring-rose-600/20",
  Suspended: "bg-rose-50 text-rose-700 ring-rose-600/20",
  Blocked: "bg-slate-100 text-slate-700 ring-slate-500/20",
  "Not a driver": "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const statusDots = {
  Verified: "bg-emerald-500",
  Pending: "bg-amber-500",
  Incomplete: "bg-brand-500",
  Rejected: "bg-rose-500",
  Suspended: "bg-rose-500",
  Blocked: "bg-slate-500",
  "Not a driver": "bg-slate-400",
};

const PAGE_SIZE = 25;
const DAY_MS = 24 * 60 * 60 * 1000;

const DRIVER_TABS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "incomplete", label: "Incomplete" },
  { value: "suspended", label: "Suspended" },
  { value: "blocked", label: "Blocked" },
];

const matchesStatusTab = (driver, tab) => {
  if (tab === "all") return true;
  if (tab === "active") {
    return driver.statusKey === "verified" && driver.isActive;
  }
  if (tab === "blocked") {
    return ["blocked", "rejected"].includes(driver.statusKey);
  }
  return driver.statusKey === tab;
};

const csvValue = (value) => {
  const text = String(value ?? "");
  const safeText = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
};

function Drivers() {
  const router = useRouter();
  const [query, setQuery] = usePageViewField("drivers", "query");
  const [status, setStatus] = usePageViewField("drivers", "status");
  const [rating, setRating] = usePageViewField("drivers", "rating");
  const [joinedFrom, setJoinedFrom] = usePageViewField("drivers", "joinedFrom");
  const [joinedTo, setJoinedTo] = usePageViewField("drivers", "joinedTo");
  const [hasIssues, setHasIssues] = usePageViewField("drivers", "hasIssues");
  const [payoutPending, setPayoutPending] = usePageViewField(
    "drivers",
    "payoutPending",
  );
  const [page, setPage] = usePageViewField("drivers", "page");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const debouncedQuery = useDebouncedValue(query, 300);

  const {
    data,
    isPending,
    isError,
    error,
    isFetching,
    dataUpdatedAt,
    refetch,
  } = useAllDrivers();
  const {
    data: pendingPayouts,
    isPending: pendingPayoutsPending,
    isError: pendingPayoutsIsError,
    error: pendingPayoutsError,
    refetch: refetchPendingPayouts,
  } = usePendingPayouts();

  const verifyDriver = useVerifyDriver();
  const rejectDriver = useRejectDriver();
  const suspendDriver = useSuspendDriver();
  const unsuspendDriver = useUnsuspendDriver();
  const deleteUser = useDeleteUser();
  const deleteUserById = deleteUser.mutateAsync as unknown as (variables: {
    userId: string;
  }) => Promise<unknown>;

  const allDrivers = data?.items ?? [];
  const statusTab = status === "verified" ? "active" : status;
  const pendingPayoutDriverIds = new Set(
    (pendingPayouts ?? [])
      .map((payout) => payout.driverId)
      .filter((driverId) => driverId !== null && driverId !== undefined)
      .map(String),
  );
  const payoutDataAvailable = pendingPayouts !== undefined && !pendingPayoutsIsError;
  const searchTerm = debouncedQuery.trim().toLocaleLowerCase();
  const filteredDrivers = allDrivers.filter((driver) => {
    const searchable = [
      driver.name,
      driver.phone,
      driver.vehicle,
      driver.plateNumber,
      driver.id,
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase();
    if (searchTerm && !searchable.includes(searchTerm)) return false;
    if (!matchesStatusTab(driver, statusTab)) return false;
    if (rating === "4+" && driver.rating < 4) return false;
    if (rating === "3+" && driver.rating < 3) return false;
    if (rating === "unrated" && driver.ratingCount > 0) return false;

    const joinedDate =
      typeof driver.createdAt === "string"
        ? driver.createdAt.slice(0, 10)
        : "";
    if (joinedFrom && (!joinedDate || joinedDate < joinedFrom)) return false;
    if (joinedTo && (!joinedDate || joinedDate > joinedTo)) return false;
    if (hasIssues === "yes" && driver.hasIssues !== true) return false;
    if (hasIssues === "no" && driver.hasIssues !== false) return false;
    if (
      payoutPending === "yes" &&
      !pendingPayoutDriverIds.has(String(driver.id))
    ) {
      return false;
    }
    if (
      payoutPending === "no" &&
      pendingPayoutDriverIds.has(String(driver.id))
    ) {
      return false;
    }
    return true;
  });
  const total = filteredDrivers.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const drivers = filteredDrivers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pendingOver24Hours = allDrivers.filter((driver) => {
    const pendingSince = driver.pendingSince ?? driver.createdAt;
    if (driver.statusKey !== "pending" || !pendingSince || !dataUpdatedAt) {
      return false;
    }
    const createdAt = new Date(pendingSince).getTime();
    return Number.isFinite(createdAt) && dataUpdatedAt - createdAt > DAY_MS;
  }).length;
  const driverStats = data
    ? {
        total: data.summary?.total ?? allDrivers.length,
        active: allDrivers.filter((driver) =>
          matchesStatusTab(driver, "active"),
        ).length,
        pending:
          data.summary?.pending ??
          allDrivers.filter((driver) => driver.statusKey === "pending").length,
        incomplete:
          data.summary?.incomplete ??
          allDrivers.filter((driver) => driver.statusKey === "incomplete")
            .length,
      }
    : null;

  useClampPage(page, totalPages, setPage);

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
    if (
      drivers.length > 0 &&
      drivers.every((driver) => selectedIds.has(String(driver.id)))
    ) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(
        (current) =>
          new Set([...current, ...drivers.map((driver) => String(driver.id))]),
      );
    }
  };

  const toggleSelect = (id) => {
    const key = String(id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const updateFilter = (setter, value) => {
    setter(value);
    setPage(1);
    setSelectedIds(new Set());
  };

  const exportCsv = () => {
    const columns = [
      "Name",
      "Phone",
      "Online",
      "Status",
      "Vehicle",
      "Plate",
      "Rating",
      "Joined",
      "Has issues",
      "Payout pending",
    ];
    const rows = filteredDrivers.map((driver) => [
      driver.name,
      driver.phone,
      driver.online === null
        ? "Unknown"
        : driver.online
          ? "Online"
          : "Offline",
      driver.status,
      driver.vehicle ?? "",
      driver.plateNumber ?? "",
      driver.rating,
      driver.joined,
      driver.hasIssues === null ? "Unknown" : driver.hasIssues ? "Yes" : "No",
      !payoutDataAvailable
        ? "Unknown"
        : pendingPayoutDriverIds.has(String(driver.id))
          ? "Yes"
          : "No",
    ]);
    const csv = [columns, ...rows]
      .map((row) => row.map(csvValue).join(","))
      .join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "drivers.csv";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

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
              : `${total} matching driver${total === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <div className="relative w-full sm:w-64">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              strokeWidth={2}
              aria-hidden="true"
            />
            <Input
              type="search"
              value={query}
              onChange={onQueryChange}
              placeholder="Name, phone, vehicle or plate"
              aria-label="Search drivers"
              className="h-9 w-full border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus-visible:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-100"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={exportCsv}
            disabled={!filteredDrivers.length}
            className="h-9 border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Export CSV
          </Button>
        </div>
      </div>

      <FilterStatCards
        columns="four"
        selectedFilter={statusTab}
        onSelect={onStatusChange}
        isLoading={isPending && !driverStats}
        partialMessage={
          data && !data.summary
            ? "Driver statistics are based on the records currently loaded."
            : isError && !data
              ? "Driver statistics are unavailable; no records are loaded."
              : undefined
        }
        cards={[
          {
            label: "All drivers",
            value: driverStats?.total ?? null,
            filter: "all",
          },
          {
            label: "Active",
            value: driverStats?.active ?? null,
            filter: "active",
          },
          {
            label: "Pending",
            value: driverStats?.pending ?? null,
            filter: "pending",
          },
          {
            label: "Incomplete",
            value: driverStats?.incomplete ?? null,
            filter: "incomplete",
          },
        ]}
      />

      <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-amber-900">
          <span className="font-semibold">{pendingOver24Hours}</span>{" "}
          pending driver{pendingOver24Hours === 1 ? " has" : "s have"} been
          waiting for more than 24 hours.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onStatusChange("pending")}
          className="w-fit border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
        >
          Review All
        </Button>
      </div>

      <div
        className="flex overflow-x-auto border-b border-slate-200"
        role="tablist"
        aria-label="Filter drivers by status"
      >
        {DRIVER_TABS.map((tab) => {
          const active = statusTab === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onStatusChange(tab.value)}
              className={`-mb-px shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
                active
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">Rating</span>
          <select
            value={rating}
            onChange={(event) => updateFilter(setRating, event.target.value)}
            aria-label="Filter by rating"
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option value="all">Any rating</option>
            <option value="4+">4 stars and up</option>
            <option value="3+">3 stars and up</option>
            <option value="unrated">Unrated</option>
          </select>
        </label>
        <fieldset className="flex flex-wrap items-end gap-2">
          <legend className="mb-1 w-full text-xs font-semibold text-slate-600">
            Joined date
          </legend>
          <Input
            type="date"
            value={joinedFrom}
            max={joinedTo || undefined}
            onChange={(event) =>
              updateFilter(setJoinedFrom, event.target.value)
            }
            aria-label="Joined from date"
            className="h-9 w-36 border-slate-200 bg-white text-sm text-slate-700 focus-visible:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-100"
          />
          <Input
            type="date"
            value={joinedTo}
            min={joinedFrom || undefined}
            onChange={(event) => updateFilter(setJoinedTo, event.target.value)}
            aria-label="Joined to date"
            className="h-9 w-36 border-slate-200 bg-white text-sm text-slate-700 focus-visible:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-100"
          />
        </fieldset>
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">
            Has issues
          </span>
          <select
            value={hasIssues}
            onChange={(event) => updateFilter(setHasIssues, event.target.value)}
            aria-label="Filter by issues"
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option value="all">Any</option>
            <option value="yes">Has issues</option>
            <option value="no">No issues</option>
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">
            Payout pending
          </span>
          <select
            value={payoutPending}
            onChange={(event) =>
              updateFilter(setPayoutPending, event.target.value)
            }
            aria-label="Filter by pending payout"
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option value="all">Any</option>
            <option value="yes">Pending payout</option>
            <option value="no">No pending payout</option>
          </select>
        </label>
        {hasIssues !== "all" &&
          allDrivers.some((driver) => driver.hasIssues === null) && (
            <p className="basis-full text-xs text-slate-500">
              Drivers without issue data are omitted from this filter.
            </p>
          )}
        {(rating !== "all" ||
          joinedFrom ||
          joinedTo ||
          hasIssues !== "all" ||
          payoutPending !== "all") && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setRating("all");
              setJoinedFrom("");
              setJoinedTo("");
              setHasIssues("all");
              setPayoutPending("all");
              setPage(1);
              setSelectedIds(new Set());
            }}
            className="h-9 px-2 text-sm text-slate-600"
          >
            Clear filters
          </Button>
        )}
      </div>

      <Card className="gap-0 rounded-xl py-0 shadow-card ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 sm:px-5">
          <RefreshIndicator
            isFetching={isFetching}
            updatedAt={dataUpdatedAt}
            onRefresh={refetch}
          />
          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="text-xs font-semibold text-slate-600">
                {selectedIds.size} selected
              </span>
              <Button
                type="button"
                onClick={() => setBulkDeleteOpen(true)}
                className="h-auto rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-70"
                disabled={deleteUser.isPending}
              >
                Delete selected
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={clearSelection}
                className="h-auto rounded-lg border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Clear
              </Button>
            </div>
          )}
        </div>
        <Table className="min-w-full">
          <TableHeader className="bg-slate-50 [&_tr]:border-slate-200">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 pr-4">
                <Checkbox
                  aria-label="Select all drivers"
                  className="border-slate-300 focus-visible:ring-brand-500"
                  checked={
                    drivers.length > 0 &&
                    drivers.every((driver) =>
                      selectedIds.has(String(driver.id)),
                    )
                  }
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          {(isPending || (payoutPending !== "all" && pendingPayoutsPending)) && (
            <TableSkeleton
              rows={PAGE_SIZE}
              cols={6}
              mobileCols={4}
            />
          )}

          {isError && (
            <TableBody>
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="p-0">
                  <QueryError error={error} onRetry={refetch} />
                </TableCell>
              </TableRow>
            </TableBody>
          )}

          {!isError &&
            payoutPending !== "all" &&
            pendingPayoutsIsError && (
              <TableBody>
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="p-0">
                    <QueryError
                      error={pendingPayoutsError}
                      onRetry={refetchPendingPayouts}
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            )}

          {!isPending &&
            !isError &&
            !(payoutPending !== "all" && pendingPayoutsPending) &&
            !(payoutPending !== "all" && pendingPayoutsIsError) && (
            <TableBody>
              {drivers.map((r) => (
                <TableRow
                  key={r.id}
                  onClick={() => router.push(`/drivers/${encodeURIComponent(r.id)}`)}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      router.push(`/drivers/${encodeURIComponent(r.id)}`);
                    }
                  }}
                  tabIndex={0}
                  className="cursor-pointer focus-visible:outline-2 focus-visible:outline-brand-600"
                >
                  <TableCell
                    className="pr-4"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Checkbox
                      aria-label={`Select ${r.name}`}
                      className="border-slate-300 focus-visible:ring-brand-500"
                      checked={selectedIds.has(String(r.id))}
                      onCheckedChange={() => toggleSelect(r.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="min-w-40">
                      <p className="max-w-48 truncate font-medium text-slate-900">
                        {r.name}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`gap-1.5 rounded-full border-transparent px-2.5 ring-1 ring-inset ${statusStyles[r.status] ?? statusStyles["Not a driver"]}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${statusDots[r.status] ?? statusDots["Not a driver"]}`}
                        aria-hidden="true"
                      />
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="max-w-40 truncate text-sm font-medium text-slate-800">
                      {r.vehicle ?? "Not provided"}
                    </p>
                    {r.plateNumber && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        {r.plateNumber}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
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
                      {r.ratingCount > 0 || r.rating > 0
                        ? r.rating.toFixed(1)
                        : "—"}
                    </span>
                  </TableCell>
                  <TableCell
                    className="text-right"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="link"
                        onClick={() =>
                          router.push(
                            `/drivers/${encodeURIComponent(r.id)}${
                              r.statusKey === "pending"
                                ? "#driver-documents"
                                : ""
                            }`,
                          )
                        }
                        className="h-auto px-2 py-1 text-xs font-semibold text-brand-700"
                      >
                        {r.statusKey === "pending" ? "Review" : "View →"}
                      </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                          aria-label={`Actions for ${r.name}`}
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
                          onSelect={() =>
                            router.push(`/drivers/${encodeURIComponent(r.id)}`)
                          }
                          className="px-2.5 py-1.5 text-xs font-medium text-slate-600 focus:bg-slate-50 focus:text-slate-700"
                        >
                          Open profile
                        </DropdownMenuItem>
                        {r.statusKey === "pending" && (
                          <DropdownMenuItem
                            onSelect={() =>
                              router.push(
                                `/drivers/${encodeURIComponent(r.id)}#driver-documents`,
                              )
                            }
                            className="px-2.5 py-1.5 text-xs font-medium text-slate-600 focus:bg-slate-50 focus:text-slate-700"
                          >
                            Review documents
                          </DropdownMenuItem>
                        )}
                        {r.statusKey === "pending" && (
                          <>
                            <DropdownMenuItem
                              onSelect={() =>
                                (
                                  verifyDriver.mutate as unknown as (variables: {
                                    driverId: typeof r.id;
                                  }) => void
                                )({ driverId: r.id })
                              }
                              disabled={verifyDriver.isPending}
                              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 focus:bg-slate-50 focus:text-slate-700"
                            >
                              Verify
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => {
                                setRejectReason("");
                                setRejectTarget(r);
                              }}
                              className="px-2.5 py-1.5 text-xs font-medium"
                            >
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        {r.statusKey === "verified" && (
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => {
                              setSuspendReason("");
                              setSuspendTarget(r);
                            }}
                            className="px-2.5 py-1.5 text-xs font-medium"
                          >
                            Suspend
                          </DropdownMenuItem>
                        )}
                        {r.statusKey === "suspended" && (
                          <DropdownMenuItem
                            onSelect={() =>
                              (
                                unsuspendDriver.mutate as unknown as (variables: {
                                  driverId: typeof r.id;
                                }) => void
                              )({ driverId: r.id })
                            }
                            disabled={unsuspendDriver.isPending}
                            className="px-2.5 py-1.5 text-xs font-medium text-slate-600 focus:bg-slate-50 focus:text-slate-700"
                          >
                            Unsuspend
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator className="bg-slate-100" />
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setDeleteTarget(r)}
                          disabled={deleteUser.isPending}
                          className="px-2.5 py-1.5 text-xs font-medium"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {drivers.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-slate-500"
                  >
                    No drivers match the current search and filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          )}
        </Table>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3.5 sm:px-5">
          <p className="text-xs text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, total)}
            </span>{" "}
            of <span className="font-semibold text-slate-700">{total}</span>
            {" "}drivers · Page{" "}
            <span className="font-semibold text-slate-700">{page}</span> of{" "}
            <span className="font-semibold text-slate-700">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
              className="h-auto border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:text-slate-400 disabled:opacity-100 disabled:hover:bg-white"
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
              className="h-auto border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:text-slate-400 disabled:opacity-100 disabled:hover:bg-white"
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <ReasonDialog
        open={Boolean(rejectTarget)}
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
