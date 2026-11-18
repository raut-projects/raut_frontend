"use client";

import type { LiveRide } from "@/lib/liveRides";
import {
  LIVE_RIDE_STATUS_LABELS,
  formatAgo,
  formatEta,
  formatMoneyTZS,
} from "@/lib/liveRides";
import { Map as MapIcon, MessageCircle, Phone, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import SidePanel from "@/components/SidePanel";
import LiveRideStatusIcon from "./LiveRideStatusIcon";

type LiveRideDetailPanelProps = {
  ride?: LiveRide;
  open: boolean;
  onClose: () => void;
  canManage: boolean;
  canEscalateNote: boolean;
  onCancel: () => void;
  onContactBoth: () => void;
  onFlag: () => void;
  onOverrideFare: () => void;
  onEscalate: () => void;
  onAddNote: () => void;
  onViewHistory: () => void;
};

const statusStyles: Record<string, { bg: string; text: string }> = {
  accepted: { bg: "bg-emerald-50", text: "text-emerald-700" },
  arrived: { bg: "bg-blue-50", text: "text-blue-700" },
  picked_up: { bg: "bg-amber-50", text: "text-amber-700" },
  near_dropoff: { bg: "bg-orange-50", text: "text-orange-700" },
  completed: { bg: "bg-slate-100", text: "text-slate-600" },
};

export default function LiveRideDetailPanel({
  ride,
  open,
  onClose,
  canManage,
  canEscalateNote,
  onCancel,
  onContactBoth,
  onFlag,
  onOverrideFare,
  onEscalate,
  onAddNote,
  onViewHistory,
}: LiveRideDetailPanelProps) {
  if (!ride) return null;

  const style = statusStyles[ride.status];
  const customersText = ride.customers.map((c) => c.name).join(", ");

  const call = (phone: string) => {
    if (phone) window.location.href = `tel:${phone}`;
  };
  const sms = (phone: string) => {
    if (phone) window.location.href = `sms:${phone}`;
  };

  return (
    <SidePanel
      open={ open }
      onClose={ onClose }
      title={ `Ride Details: ${ride.displayId}` }
      description={ `${LIVE_RIDE_STATUS_LABELS[ride.status]} - ${formatAgo(ride.statusChangedAt)}` }
      wide
      footer={
        <div className="flex items-center justify-between gap-2">
          { canManage && (
            <>
              <Button variant="outline" size="sm" onClick={ onFlag }>
                Flag issue
              </Button>
              <Button variant="outline" size="sm" onClick={ onOverrideFare }>
                Override fare
              </Button>
              <Button variant="destructive" size="sm" onClick={ onCancel }>
                Cancel ride
              </Button>
            </>
          ) }
          { !canManage && canEscalateNote && (
            <>
              <Button variant="outline" size="sm" onClick={ onEscalate }>
                Escalate
              </Button>
              <Button variant="outline" size="sm" onClick={ onAddNote }>
                Add note
              </Button>
            </>
          ) }
          <Button size="sm" onClick={ onViewHistory }>
            View history
          </Button>
          <Button size="sm" onClick={ onContactBoth }>
            Contact both
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Section 1: Status header */ }
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <LiveRideStatusIcon status={ride.status} size={20} />
              <span className={ `font-bold ${style.text}` }>
                { LIVE_RIDE_STATUS_LABELS[ride.status] }
              </span>
              <Badge variant="secondary" className="ml-auto text-[10px]">
                { formatAgo(ride.statusChangedAt) }
              </Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              { ride.status === "picked_up"
                ? "Rider in vehicle, heading to dropoff"
                : ride.status === "arrived"
                  ? "Driver at pickup location, waiting"
                  : ride.status === "accepted"
                    ? "Driver accepted, heading to pickup"
                    : ride.status === "near_dropoff"
                      ? "Within 1 km of destination"
                      : "Ride completed" }
            </p>
          </div>
        </div>
        <Separator />

        {/* Section 2: Driver */ }
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Driver</h3>
          <div className="flex items-start gap-3">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">{ ride.driver.name }</p>
              <p className="text-xs text-slate-500">{ ride.driver.vehicle } - { ride.driver.plate }</p>
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden="true" />
                { ride.driver.rating } ({ ride.driver.ratingCount } rides)
              </p>
            </div>
            <div className="ml-auto flex flex-col gap-1">
              <Button size="sm" onClick={ () => call(ride.driver.phone) } className="text-[11px]">
                <Phone className="w-3 h-3 mr-1" /> Call
              </Button>
              <Button size="sm" variant="outline" onClick={ () => sms(ride.driver.phone) } className="text-[11px]">
                <MessageCircle className="w-3 h-3 mr-1" /> SMS
              </Button>
            </div>
          </div>
        </div>
        <Separator />

        {/* Section 3: Customer(s) */ }
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Customer{ ride.customers.length > 1 ? "s" : "" }
          </h3>
          <div className="flex items-start gap-3">
            <div>
              <p className="text-sm font-medium text-slate-900">{ customersText }</p>
              { ride.customers.map((b) => (
                <p key={ b.id } className="flex items-center gap-1 text-xs text-slate-500">
                  <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden="true" />
                  { b.rating } ({ b.ratingCount } rides)
                </p>
              )) }
            </div>
            <div className="ml-auto flex flex-col gap-1">
              { ride.customers.map((c) => (
                <div key={ c.id } className="flex items-center gap-1">
                  <Button
                    size="sm"
                    onClick={ () => call(c.phone) }
                    className="text-[10px] px-2 py-1"
                  >
                    <Phone className="w-3 h-3 mr-1" /> Call
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={ () => sms(c.phone) }
                    className="text-[10px] px-2 py-1"
                  >
                    <MessageCircle className="w-3 h-3 mr-1" /> SMS
                  </Button>
                </div>
              )) }
            </div>
          </div>
        </div>
        <Separator />

        {/* Section 4: Route */ }
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Route</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Pickup</p>
              <p className="text-sm font-medium text-slate-900">{ ride.pickup.name }</p>
              <p className="text-xs text-slate-500">
                { ride.status === "picked_up"
                  ? "Picked up"
                  : ride.status === "arrived"
                    ? "Driver arrived"
                    : "Waiting for driver" }
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Dropoff</p>
              <p className="text-sm font-medium text-slate-900">{ ride.dropoff.name }</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-slate-500">Distance</span>
            <span className="font-medium text-slate-900">{ ride.distanceKm } km</span>
            <span className="text-slate-500">ETA</span>
            <span className="font-medium text-slate-900">{ formatEta(ride.etaMin) }</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            asChild
            onClick={ (e) => {
              e.preventDefault();
            } }
          >
            <a href="#" className="flex items-center gap-1 text-[11px] text-brand-600 hover:text-brand-700">
              <MapIcon className="w-3 h-3" /> View map
            </a>
          </Button>
        </div>
        <Separator />

        {/* Section 5: Fare */ }
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Fare estimate</h3>
          <p className="text-lg font-bold text-slate-900">{ formatMoneyTZS(ride.fare.total) }</p>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="p-2 rounded-lg border border-slate-100 bg-slate-50">
              <p className="text-slate-500 uppercase text-[10px]">Base</p>
              <p className="text-slate-700">{ formatMoneyTZS(ride.fare.base) }</p>
            </div>
            <div className="p-2 rounded-lg border border-slate-100 bg-slate-50">
              <p className="text-slate-500 uppercase text-[10px]">Distance</p>
              <p className="text-slate-700">{ formatMoneyTZS(ride.fare.distance) }</p>
            </div>
            <div className="p-2 rounded-lg border border-slate-100 bg-slate-50">
              <p className="text-slate-500 uppercase text-[10px]">Time</p>
              <p className="text-slate-700">{ formatMoneyTZS(ride.fare.time) }</p>
            </div>
            <div className="p-2 rounded-lg border border-slate-100 bg-slate-50">
              <p className="text-slate-500 uppercase text-[10px]">Platform</p>
              <p className="text-slate-700">{ ride.fare.platformPct }%</p>
            </div>
          </div>
        </div>
        <Separator />

        {/* Section 6: Admin actions */ }
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Admin actions</h3>
          <p className="text-xs text-slate-500">
            { canManage
              ? "Full control actions are available."
              : canEscalateNote
                ? "View-only: escalate or add notes."
                : "Read-only view." }
          </p>
        </div>
      </div>
    </SidePanel>
  );
}
