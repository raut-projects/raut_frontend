"use client";

import type { LiveRide } from "@/lib/liveRides";
import { Button } from "../ui/button";

import {
  LIVE_RIDE_STATUS_LABELS,
  LIVE_RIDE_STATUS_EMOJI,
  LIVE_RIDE_TYPE_LABELS,
  formatAgo,
  formatEta,
  formatMoneyTZS,
} from "@/lib/liveRides";
import { Badge } from "@/components/ui/badge";

const statusStyles: Record<string, { bg: string; text: string; ring: string }> = {
  accepted: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-600/20" },
  arrived: { bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-600/20" },
  picked_up: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-600/20" },
  near_dropoff: { bg: "bg-orange-50", text: "text-orange-700", ring: "ring-orange-600/20" },
  completed: { bg: "bg-slate-100", text: "text-slate-600", ring: "ring-slate-500/20" },
};


type LiveRidesListProps = {
  rides: LiveRide[];
  containerRef: React.RefObject<HTMLDivElement>;
  offsetY: number;
  totalHeight: number;
  itemHeight: number;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  selectedRideId: string | null;
  hoveredRideId: string | null;
  onViewDetails: (ride: LiveRide) => void;
  onContact: (ride: LiveRide) => void;
  onHover: (rideId: string | null) => void;
};

export default function LiveRidesList({
  rides,
  containerRef,
  offsetY,
  totalHeight,
  onScroll,
  selectedRideId,
  hoveredRideId,
  onHover,
  onViewDetails,
  onContact,
}: LiveRidesListProps) {
  if (rides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <p>No active rides match the current filters.</p>
      </div>
    );
  }
  return (
    <div
      ref={ containerRef }
      onScroll={ onScroll }
      className="relative h-full overflow-y-auto pr-2"
    >
      <div style={ { height: totalHeight } } />
      <div
        style={ {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          transform: `translateY(${offsetY}px)`,
        } }
      >
        { rides.map((ride) => {
          const style = statusStyles[ride.status];
          const customersText = ride.customers.map((c) => c.name).join(", ");
          const isIssue = ride.hasIssue;

          return (
            <section key={ ride.id } className="liveRideCard">
              <div
                className={`
        p-3 transition-all duration-150
        ${hoveredRideId === ride.id ? "border-b-2" : " border-b hover:bg-slate-50 hover:shadow-sm"}
        ${ride.id === selectedRideId ? "ring-2 ring-brand-600 bg-brand-50" : ""}
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
            </section>
          );
        }) }
      </div>
    </div>
  );
}
