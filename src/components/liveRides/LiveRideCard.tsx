"use client";

import type { LiveRide } from "@/lib/liveRides";
import {
  LIVE_RIDE_STATUS_LABELS,
  LIVE_RIDE_STATUS_EMOJI,
  LIVE_RIDE_TYPE_LABELS,
  formatAgo,
  formatEta,
  formatMoneyTZS,
} from "@/lib/liveRides";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type LiveRideCardProps = {
  ride: LiveRide;
  selected: boolean;
  hovered: boolean;
  onHover: (rideId: string | null) => void;
  onViewDetails: (ride: LiveRide) => void;
  onContact: (ride: LiveRide) => void;
};

const statusStyles: Record<string, { bg: string; text: string; ring: string }> = {
  accepted: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-600/20" },
  arrived: { bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-600/20" },
  picked_up: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-600/20" },
  near_dropoff: { bg: "bg-orange-50", text: "text-orange-700", ring: "ring-orange-600/20" },
  completed: { bg: "bg-slate-100", text: "text-slate-600", ring: "ring-slate-500/20" },
};

export default function LiveRideCard({
  ride,
  selected,
  hovered,
  onHover,
  onViewDetails,
  onContact,
}: LiveRideCardProps) {
  const style = statusStyles[ride.status];
  const customersText = ride.customers.map((c) => c.name).join(", ");
  const isIssue = ride.hasIssue;

  return (
    <div
      className={`
        rounded-xl border p-3 transition-all duration-150
        ${hovered ? "ring-2 ring-brand-500 bg-brand-50 shadow-sm" : "border-slate-200 hover:bg-slate-50 hover:shadow-sm"}
        ${selected ? "ring-2 ring-brand-600 bg-brand-50" : ""}
        ${isIssue ? "border-rose-200" : ""}
      `}
      onClick={ () => onViewDetails(ride) }
      onMouseEnter={ () => onHover(ride.id) }
      onMouseLeave={ () => onHover(null) }
      role="button"
      tabIndex={ 0 }
      onKeyDown={ (e) => (e.key === "Enter" ? onViewDetails(ride) : null) }
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-900">{ ride.displayId }</span>
          <Badge variant="outline" className="text-[10px] px-2 py-0.5">
            { LIVE_RIDE_TYPE_LABELS[ride.type] }
          </Badge>
        </div>
        { ride.hasIssue && (
          <Badge variant="destructive" className="text-[10px] px-2 py-0.5">
            Issue
          </Badge>
        ) }
      </div>

      <div className="mb-1">
        <p className="text-xs font-medium text-slate-900 truncate">
          { ride.driver.name }
          <span className="ml-1 text-xs text-slate-400">→</span>
          <span className="font-medium">{ customersText }</span>
        </p>
      </div>

      <div className="flex items-center gap-2 mb-1.5">
        <span className={ `text-xs ${style.text}` }>{ LIVE_RIDE_STATUS_EMOJI[ride.status] }</span>
        <span className={ `text-xs font-semibold ${style.text}` }>
          { LIVE_RIDE_STATUS_LABELS[ride.status] }
        </span>
        <span className="ml-auto text-xs text-slate-500">{ formatAgo(ride.statusChangedAt) }</span>
      </div>

      <div className="mb-1.5">
        <p className="text-xs text-slate-500 truncate" title={ `${ride.pickup.name} → ${ride.dropoff.name}` }>
          { ride.pickup.name } → { ride.dropoff.name }
        </p>
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-slate-500">
          <span className="mr-1">ETA</span>
          <span className="font-medium text-slate-700">{ formatEta(ride.etaMin) }</span>
        </div>
        <span className="font-semibold text-slate-900">{ formatMoneyTZS(ride.fare.total) }</span>
      </div>

      <div className="mt-2 flex items-center gap-2 pt-2 border-t border-slate-100">
        <Button
          size="sm"
          variant="outline"
          onClick={ (e) => {
            e.stopPropagation();
            onViewDetails(ride);
          } }
          className="flex-1 text-[11px] px-2 py-1"
        >
          View details
        </Button>
        <Button
          size="sm"
          onClick={ (e) => {
            e.stopPropagation();
            onContact(ride);
          } }
          className="text-[11px] px-2 py-1"
        >
          Contact
        </Button>
      </div>
    </div>
  );
}
