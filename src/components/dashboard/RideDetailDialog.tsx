"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, CarFront, MapPin, UsersRound } from "lucide-react";

import SidePanel from "@/components/SidePanel";
import {
  formatEta,
  formatMoneyTZS,
  LIVE_RIDE_STATUS_LABELS,
  LIVE_RIDE_TYPE_LABELS,
  type LiveRide,
} from "@/lib/liveRides";

const ISSUE_LABELS: Array<{ key: keyof LiveRide["issues"]; label: string }> = [
  { key: "longWait", label: "Long wait" },
  { key: "offRoute", label: "Off route" },
  { key: "delayed", label: "Delayed" },
  { key: "flagged", label: "Flagged" },
];

function DetailLine({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-slate-100 py-2 last:border-0">
      <dt className="shrink-0 text-xs text-slate-500">{ label }</dt>
      <dd className="min-w-0 truncate text-right text-sm font-medium text-slate-900">
        { value }
      </dd>
    </div>
  );
}

type RideDetailDialogProps = {
  ride: LiveRide | null;
  open: boolean;
  onClose: () => void;
};

export function RideDetailDialog({ ride, open, onClose }: RideDetailDialogProps) {
  const issues = ride
    ? ISSUE_LABELS.filter(({ key }) => ride.issues[key]).map(({ label }) => label)
    : [];

  return (
    <SidePanel
      open={ open }
      onClose={ onClose }
      title="Ride details"
      description={ ride ? `${ride.displayId} · ${LIVE_RIDE_TYPE_LABELS[ride.type]}` : undefined }
      footer={
        ride && (
          <Link
            href={ `/live-rides?ride=${encodeURIComponent(ride.displayId)}` }
            onClick={ onClose }
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            Open in live rides
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        )
      }
    >
      { ride ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <p className="text-lg font-bold tracking-tight text-slate-900">
                { ride.displayId }
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Requested { new Date(ride.requestedAt).toLocaleTimeString("en-TZ", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Africa/Dar_es_Salaam",
                }) }
              </p>
            </div>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
              { LIVE_RIDE_STATUS_LABELS[ride.status] }
            </span>
          </div>

          <section className="space-y-1">
            <div className="flex items-center gap-2 pb-1">
              <CarFront className="size-4 text-slate-400" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-slate-900">Driver</h3>
            </div>
            <dl>
              <DetailLine label="Name" value={ ride.driver.name } />
              <DetailLine label="Phone" value={ ride.driver.phone } />
              <DetailLine
                label="Vehicle"
                value={ `${ride.driver.vehicle} · ${ride.driver.plate}` }
              />
              <DetailLine
                label="Rating"
                value={ `${ride.driver.rating.toFixed(1)} (${ride.driver.ratingCount})` }
              />
            </dl>
          </section>

          <section className="space-y-1">
            <div className="flex items-center gap-2 pb-1">
              <UsersRound className="size-4 text-slate-400" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-slate-900">Customers</h3>
            </div>
            <dl>
              { ride.customers.length === 0 && (
                <p className="py-2 text-xs text-slate-500">No customer details.</p>
              ) }
              { ride.customers.map((customer) => (
                <DetailLine
                  key={ customer.id }
                  label={ customer.name }
                  value={ customer.phone }
                />
              )) }
            </dl>
          </section>

          <section className="space-y-1">
            <div className="flex items-center gap-2 pb-1">
              <MapPin className="size-4 text-slate-400" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-slate-900">Route</h3>
            </div>
            <dl>
              <DetailLine label="Pickup" value={ ride.pickup.name } />
              <DetailLine label="Dropoff" value={ ride.dropoff.name } />
              <DetailLine label="Distance" value={ `${ride.distanceKm.toFixed(1)} km` } />
              <DetailLine label="ETA" value={ formatEta(ride.etaMin) } />
            </dl>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900">Trip &amp; issues</h3>
            <dl>
              <DetailLine label="Fare" value={ formatMoneyTZS(ride.fare.total) } />
              <DetailLine label="Platform fee" value={ formatMoneyTZS(ride.fare.platformFee) } />
              <DetailLine label="Seats" value={ String(ride.seats) } />
            </dl>
            { issues.length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                No active issues.
              </p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                { issues.map((issue) => (
                  <li
                    key={ issue }
                    className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700"
                  >
                    { issue }
                  </li>
                )) }
              </ul>
            ) }
          </section>
        </div>
      ) : (
        <p className="py-14 text-center text-sm text-slate-500">
          Select a ride marker to see its details.
        </p>
      ) }
    </SidePanel>
  );
}
