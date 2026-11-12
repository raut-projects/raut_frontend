"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EllipsisVertical } from "lucide-react";
import {
  QueryError,
  RefreshIndicator,
  TableSkeleton,
} from "@/components/queryStates";
import { Button } from "@/components/ui/button";
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
import { ReasonDialog } from "@/components/reasonDialog";
import ViewRidePanel from "@/components/viewRidePanel";
import { useRideSummary, useRides } from "@/hooks/useRides";
import { useDrivers } from "@/hooks/useDrivers";
import { useCancelRide } from "@/hooks/useAdminActions";
import { usePageViewField } from "@/store/pageViewStore";
import { useClampPage } from "@/hooks/useClampPage";
import { mockHasDispute } from "@/lib/rideDisputes";

const statusStyles = {
  Pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  "In transit": "bg-brand-50 text-brand-700 ring-brand-600/20",
  Delivered: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Cancelled: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const statusDots = {
  Pending: "bg-amber-500",
  "In transit": "bg-brand-500",
  Delivered: "bg-emerald-500",
  Cancelled: "bg-slate-400",
};

const statusLabels = {
  requested: "Pending",
  picked_up: "In transit",
  completed: "Delivered",
  cancelled: "Cancelled",
};

const TERMINAL_STATUSES = ["completed", "cancelled", "rejected", "expired"];

const PAGE_SIZE = 10;

const controlClass =
  "rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";

function Rides() {
  const [status, setStatus] = usePageViewField("rides", "status");
  const [driverId, setDriverId] = usePageViewField("rides", "driverId");
  const [from, setFrom] = usePageViewField("rides", "from");
  const [to, setTo] = usePageViewField("rides", "to");
  const [page, setPage] = usePageViewField("rides", "page");
  const [viewTarget, setViewTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [onlyDisputed, setOnlyDisputed] = useState(false);

  const params = { status, driverId, from, to, page, limit: PAGE_SIZE };

  const {
    data,
    isPending,
    isError,
    error,
    isFetching,
    isPlaceholderData,
    dataUpdatedAt,
    refetch,
  } = useRides(params);

  const { data: summary, isPending: summaryPending } = useRideSummary();

  // The driver filter needs the fleet, the backend filters rides by driver id.
  const { data: driverData } = useDrivers({ page: 1, limit: 100 });
  const drivers = driverData?.items ?? [];

  const cancelRide = useCancelRide();
  const router = useRouter();

  const rides = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const displayedRides = onlyDisputed
    ? rides.filter((ride) => mockHasDispute(ride.rideId))
    : rides;

  useClampPage(page, totalPages, setPage);

  const summaryCards = [
    {
      label: "Total rides",
      value: summary?.total ?? 0,
      hint: "On record",
      status: "all",
    },
    {
      label: "Pending",
      value: summary?.pending ?? 0,
      hint: "Awaiting a driver",
      status: "requested",
    },
    {
      label: "Delivered",
      value: summary?.delivered ?? 0,
      hint: "Completed trips",
      status: "completed",
    },
    {
      label: "Cancelled",
      value: summary?.cancelled ?? 0,
      hint: "Cancelled trips",
      status: "cancelled",
    },
  ];

  const resetPage = () => setPage(1);

  const onStatusChange = (next) => {
    setStatus(next);
    resetPage();
  };

  const onDriverChange = (next) => {
    setDriverId(next);
    resetPage();
  };

  const onFromChange = (next) => {
    setFrom(next);
    resetPage();
  };

  const onToChange = (next) => {
    setTo(next);
    resetPage();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Rides
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            { isPending
              ? "Loading rides."
              : status === "all"
                ? `${total} ride${total === 1 ? "" : "s"} on record`
                : `${total} ${statusLabels[status] ?? status} ride${total === 1 ? "" : "s"}` }
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={ status }
            onChange={ (event) => onStatusChange(event.target.value) }
            aria-label="Filter rides by status"
            className={ controlClass }
          >
            <option value="all">All statuses</option>
            <option value="requested">Pending</option>
            <option value="picked_up">In transit</option>
            <option value="completed">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={ driverId }
            onChange={ (event) => onDriverChange(event.target.value) }
            aria-label="Filter rides by driver"
            className={ `${controlClass} max-w-48` }
          >
            <option value="">All drivers</option>
            { drivers.map((driver) => (
              <option key={ driver.id } value={ driver.id }>
                { driver.name }
              </option>
            )) }
          </select>

          <input
            type="date"
            value={ from }
            onChange={ (event) => onFromChange(event.target.value) }
            aria-label="Rides requested from"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />

          <input
            type="date"
            value={ to }
            onChange={ (event) => onToChange(event.target.value) }
            aria-label="Rides requested until"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
          <label className="flex items-center gap-1 cursor-pointer text-xs text-slate-600 hover:text-slate-900">
            <input
              type="checkbox"
              checked={ onlyDisputed }
              onChange={ (event) => setOnlyDisputed(event.target.checked) }
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Only disputed
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        { summaryCards.map((card) => {
          const active = status === card.status;

          return (
            <button
              key={ card.label }
              type="button"
              onClick={ () => onStatusChange(card.status) }
              aria-pressed={ active }
              className={ `cursor-pointer stat-card text-left transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${active ? "ring-2 ring-brand-500" : "hover:shadow-md"
                }` }
            >
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                { card.label }
              </p>
              <p className="mt-1.5 text-lg font-bold tracking-tight sm:text-2xl text-slate-900">
                { summaryPending ? "-" : card.value }
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{ card.hint }</p>
            </button>
          );
        }) }
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 sm:px-5">
          <RefreshIndicator
            isFetching={ isFetching }
            updatedAt={ dataUpdatedAt }
            onRefresh={ refetch }
          />
        </div>
        <Table className="min-w-full">
          <TableHeader className="bg-slate-50 [&_tr]:border-slate-200">
            <TableRow className="hover:bg-transparent">
              <TableHead>Ride</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden lg:table-cell">Driver</TableHead>
              <TableHead className="hidden xl:table-cell">Route</TableHead>
              <TableHead className="hidden lg:table-cell">Fare</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden xl:table-cell">Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          { isPending && (
            <TableSkeleton
              rows={ PAGE_SIZE }
              cols={ 8 }
              mobileCols={ 4 }
              lgCols={ 6 }
            />
          ) }

          { isError && (
            <TableBody>
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={ 8 } className="p-0">
                  <QueryError error={ error } onRetry={ refetch } />
                </TableCell>
              </TableRow>
            </TableBody>
          ) }

          { !isPending && !isError && (
            <TableBody>
              { displayedRides.map((ride) => (
                <TableRow
                  key={ ride.id }
                  onClick={ () => setViewTarget(ride) }
                  onKeyDown={ (event) => {
                    if (event.target !== event.currentTarget) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setViewTarget(ride);
                    }
                  } }
                  tabIndex={ 0 }
                  className="cursor-pointer focus-visible:outline-2 focus-visible:outline-brand-600"
                >
                  <TableCell className="font-medium text-slate-900">
                    <span className="block">{ ride.id }</span>
                    <span className="block text-xs font-normal text-slate-400 lg:hidden">
                      { ride.amount }
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="block max-w-20 truncate text-slate-900 sm:max-w-none">
                      { ride.customer }
                    </span>
                    <span className="block max-w-20 truncate text-xs text-slate-400">
                      { ride.customerPhone }
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="block text-slate-900">{ ride.driver }</span>
                    <span className="block text-xs text-slate-400">
                      { ride.driverPhone }
                    </span>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <span className="block max-w-48 truncate text-slate-700">
                      { ride.route }
                    </span>
                  </TableCell>
                  <TableCell className="hidden font-medium text-slate-900 lg:table-cell">
                    { ride.amount }
                  </TableCell>
                  <TableCell>
                    <span
                      className={ `badge ring-1 ring-inset ${statusStyles[ride.status] ?? statusStyles.Pending
                        }` }
                    >
                      <span
                        className={ `h-1.5 w-1.5 rounded-full ${statusDots[ride.status] ?? statusDots.Pending}` }
                        aria-hidden="true"
                      />
                      { ride.status }
                      { mockHasDispute(ride.rideId) && (
                        <span className="ml-1 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand-50 text-brand-700 border border-brand-200">
                          Disputed
                        </span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    { ride.date }
                  </TableCell>
                  <TableCell
                    className="text-right"
                    onClick={ (event) => event.stopPropagation() }
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                          aria-label={ `Actions for ${ride.id}` }
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
                          onSelect={ () => setViewTarget(ride) }
                          className="px-2.5 py-1.5 text-xs font-medium text-slate-600 focus:bg-slate-50 focus:text-slate-700"
                        >
                          View
                        </DropdownMenuItem>
                        { !TERMINAL_STATUSES.includes(ride.statusKey) && (
                          <>
                            <DropdownMenuSeparator className="bg-slate-100" />
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={ () => {
                                setCancelReason("");
                                setCancelTarget(ride);
                              } }
                              className="px-2.5 py-1.5 text-xs font-medium"
                            >
                              Cancel ride
                            </DropdownMenuItem>
                          </>
                        )}
                        { ride.statusKey !== "cancelled" && (
                          <>
                            <DropdownMenuSeparator className="bg-slate-100" />
                            <DropdownMenuItem
                              onSelect={ () => {
                                router.push(`/rides/${ride.rideId}/dispute`);
                              } }
                              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 focus:bg-slate-50 focus:text-slate-700"
                            >
                              Resolve dispute
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) }
              { displayedRides.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={ 8 }
                    className="py-10 text-center text-slate-500"
                  >
                    No rides match these filters.
                  </TableCell>
                </TableRow>
              ) }
            </TableBody>
          ) }
        </Table>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3.5 sm:px-5">
          <p className="text-xs text-slate-500">
            Showing{ " " }
            <span className="font-semibold text-slate-700">{ onlyDisputed ? displayedRides.length : rides.length }</span>{ " " }
            of <span className="font-semibold text-slate-700">{ total }</span>
            { totalPages > 1 && (
              <>
                { " " }
                - Page{ " " }
                <span className="font-semibold text-slate-700">
                  { page }
                </span> of{ " " }
                <span className="font-semibold text-slate-700">
                  { totalPages }
                </span>
              </>
            ) }
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={ () => setPage((prev) => Math.max(1, prev - 1)) }
              disabled={ page <= 1 || isPlaceholderData }
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-white"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={ () => setPage((prev) => Math.min(totalPages, prev + 1)) }
              disabled={ page >= totalPages || isPlaceholderData }
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-white"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <ViewRidePanel
        open={ Boolean(viewTarget) }
        onClose={ () => setViewTarget(null) }
        ride={ viewTarget }
      />

      <ReasonDialog
        open={ Boolean(cancelTarget) }
        onClose={ () => setCancelTarget(null) }
        title="Cancel ride"
        description={
          cancelTarget
            ? `${cancelTarget.id} for ${cancelTarget.customer} will be cancelled and the fare refunded.`
            : undefined
        }
        confirmLabel="Cancel ride"
        label="Reason"
        tone="danger"
        placeholder="Why is this ride being cancelled?"
        value={ cancelReason }
        onChange={ setCancelReason }
        pending={ cancelRide.isPending }
        onConfirm={ async (reason) => {
          const mutateCancelRide =
            cancelRide.mutateAsync as unknown as (variables: {
              rideId: string;
              reason: string;
              refund: boolean;
            }) => Promise<unknown>;

          await mutateCancelRide({
            rideId: cancelTarget.rideId,
            reason,
            refund: true,
          });
          setCancelTarget(null);
        } }
      />
    </div>
  );
}

export default Rides;
