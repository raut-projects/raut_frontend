"use client";

import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SidePanel from "@/components/SidePanel";

type RideHistoryTimelineProps = {
  open: boolean;
  onClose: () => void;
  rideId: string;
  getHistory: (rideId: string) => Array<{ time: string; event: string; detail?: string }>;
};

export default function RideHistoryTimeline({
  open,
  onClose,
  rideId,
  getHistory,
}: RideHistoryTimelineProps) {
  const events = open ? getHistory(rideId) : [];

  return (
    <SidePanel
      open={ open }
      onClose={ onClose }
      title={ `Ride history - ${rideId}` }
      description="Status changes, location samples, and admin events."
    >
      <div className="space-y-3">
        { events.length === 0 ? (
          <p className="text-sm text-slate-500">No history available.</p>
        ) : (
          events.map((ev, i) => (
            <div key={ i } className="flex gap-3">
              <div className="relative w-2">
                <Clock className="w-3 h-3 text-slate-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-900">{ ev.event }</p>
                <p className="text-xs text-slate-500">
                  { new Date(ev.time).toLocaleString() } { ev.detail ? `- ${ev.detail}` : "" }
                </p>
              </div>
            </div>
          ))
        ) }
      </div>
      <div className="mt-4 flex justify-end">
        <Button size="sm" onClick={ onClose }>
          Close
        </Button>
      </div>
    </SidePanel>
  );
}
