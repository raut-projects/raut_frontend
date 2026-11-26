"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, MapPin, Radio } from "lucide-react";

import { QueryError } from "@/components/queryStates";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import LiveMap from "@/components/liveRides/LiveMap";
import { useDashboardMapRides } from "@/hooks/useDashboardMapRides";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { queryKeys } from "@/lib/queryKeys";
import { listLiveRides } from "@/services/liveRides";
import {
  formatEta,
  formatMoneyTZS,
  LIVE_RIDE_STATUS_LABELS,
  LIVE_RIDE_TYPE_LABELS,
  type LiveRide,
} from "@/lib/liveRides";
import { RideDetailDialog } from "./RideDetailDialog";

const FILTERS = [
  { value: "all", label: "All Rides" },
  { value: "private", label: "Private" },
  { value: "duo", label: "DUO" },
  { value: "issues", label: "Issues Only" },
] as const;

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const connectionBadge = (connection: unknown) => {
  const record = asRecord(connection);
  const raw = String(
    (typeof connection === "string" && connection) ||
    record.status ||
    record.state ||
    (record.connected === true ? "connected" : "") ||
    (record.isConnected === true ? "connected" : "") ||
    "connecting",
  ).toLowerCase();

  if (/connected|live|open|online|healthy|mock/.test(raw)) {
    return { label: "Live", className: "border-emerald-200 bg-emerald-50 text-emerald-700" };
  }
  if (/error|fail|offline|disconnect|closed/.test(raw)) {
    return { label: "Offline", className: "border-rose-200 bg-rose-50 text-rose-700" };
  }
  return { label: "Connecting", className: "border-amber-200 bg-amber-50 text-amber-700" };
};

export function LiveMapPreview() {
  const router = useRouter();
  const { status, google } = useGoogleMaps();
  const {
    rides,
    visibleRides,
    filter,
    setFilter,
    selectedRideId,
    setSelectedRideId,
    connection,
  } = useDashboardMapRides();
  const mapQuery = useQuery({
    queryKey: queryKeys.dashboard.mapRides,
    queryFn: ({ signal }) => listLiveRides({}, { signal }),
    enabled: false,
  });
  const [hoveredRideId, setHoveredRideId] = useState<string | null>(null);
  const [activeRide, setActiveRide] = useState<LiveRide | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const previewRides = (Array.isArray(visibleRides) ? visibleRides : rides ?? [])
    .slice(0, 10) as LiveRide[];
  const selectedRide =
    previewRides.find((ride) => ride.id === selectedRideId) ?? activeRide;
  const badge = connectionBadge(connection);
  const mapsReady = status === "ready" && Boolean(google);
  const mapsUnavailable = status === "missing-key" || status === "error";

  const openRide = (ride: LiveRide) => {
    setActiveRide(ride);
    setSelectedRideId(ride.id as never);
    setDetailOpen(true);
  };

  const openLiveRides = () => router.push("/live-rides");

  return (
    <section aria-label="Live map preview">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Radio className="size-4 text-slate-500" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-slate-900">Live map</h2>
          <Badge variant="outline" className={ `rounded-md ${badge.className}` }>
            { badge.label }
          </Badge>
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
          { FILTERS.map((option) => (
            <button
              key={ option.value }
              type="button"
              aria-pressed={ filter === option.value }
              onClick={ () => setFilter(option.value as never) }
              className={ `rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${filter === option.value
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
                }` }
            >
              { option.label }
            </button>
          )) }
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
        { status === "loading" && (
          <div className="h-72 sm:h-80">
            <Skeleton className="size-full rounded-none" />
          </div>
        ) }

        { mapsUnavailable && (
          <div className="flex h-72 flex-col items-center justify-center gap-3 bg-slate-50 px-6 text-center sm:h-80">
            <MapPin className="size-6 text-slate-300" aria-hidden="true" />
            <p className="text-sm text-slate-600">
              Map unavailable -{ " " }
              <Link
                href="/live-rides"
                className="font-semibold text-slate-900 underline-offset-4 hover:underline"
              >
                View Live Rides List →
              </Link>
            </p>
          </div>
        ) }

        { mapsReady && (
          <div className="h-72 sm:h-80">
            <LiveMap
              rides={ previewRides }
              selectedRideId={ selectedRideId }
              hoveredRideId={ hoveredRideId }
              onRideClick={ (rideId) => {
                const ride = previewRides.find((item) => item.id === rideId);
                if (ride) openRide(ride);
              } }
              onRideHover={ setHoveredRideId }
              google={ google }
              hasGoogleMaps
              showWaypointPins
              compact
              onMapClick={ openLiveRides }
            />
          </div>
        ) }
      </div>

      <div className="mt-3">
        { mapQuery.isPending && (
          <div className="space-y-2">
            { Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={ index } className="h-9 w-full" />
            )) }
          </div>
        ) }
        { mapQuery.isError && <QueryError error={ mapQuery.error } onRetry={ mapQuery.refetch } /> }
        { !mapQuery.isPending && !mapQuery.isError && previewRides.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-xs text-slate-500">
            No rides match this filter.
          </p>
        ) }
        { !mapQuery.isPending && !mapQuery.isError && previewRides.length > 0 && (
          <ul className="divide-y divide-slate-100 border-t border-slate-200">
            { previewRides.map((ride) => (
              <li key={ ride.id }>
                <button
                  type="button"
                  onClick={ () => openRide(ride) }
                  className="flex w-full items-center justify-between gap-3 py-2.5 text-left hover:bg-slate-50/70"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="size-2 shrink-0 rounded-full bg-slate-900" aria-hidden="true" />
                    <span className="truncate text-sm font-medium text-slate-800">
                      { ride.displayId }
                    </span>
                    <span className="hidden truncate text-xs text-slate-500 sm:inline">
                      { LIVE_RIDE_TYPE_LABELS[ride.type] } · { ride.pickup.name } → { ride.dropoff.name }
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3 text-xs text-slate-500">
                    { ride.hasIssue && (
                      <span className="size-1.5 rounded-full bg-rose-500" aria-label="Has issue" />
                    ) }
                    <span>{ formatEta(ride.etaMin) }</span>
                    <span className="font-semibold text-slate-800">
                      { formatMoneyTZS(ride.fare.total) }
                    </span>
                    <span className="hidden text-slate-500 md:inline">
                      { LIVE_RIDE_STATUS_LABELS[ride.status] }
                    </span>
                  </span>
                </button>
              </li>
            )) }
          </ul>
        ) }
      </div>

      <button
        type="button"
        onClick={ openLiveRides }
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900"
      >
        View full live rides map
        <ArrowUpRight className="size-3.5" aria-hidden="true" />
      </button>

      <RideDetailDialog
        ride={ selectedRide }
        open={ detailOpen }
        onClose={ () => setDetailOpen(false) }
      />
    </section>
  );
}
