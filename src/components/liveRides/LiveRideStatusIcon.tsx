"use client";

import type { LucideIcon } from "lucide-react";
import { CheckCircle2, CircleCheck, MapPin, Navigation, UserRoundCheck } from "lucide-react";
import type { LiveRideStatus } from "@/lib/liveRides";

const STATUS_ICON_CONFIG: Record<
  LiveRideStatus,
  { Icon: LucideIcon; className: string }
> = {
  accepted: { Icon: CircleCheck, className: "text-emerald-600" },
  arrived: { Icon: MapPin, className: "text-blue-600" },
  picked_up: { Icon: UserRoundCheck, className: "text-amber-600" },
  near_dropoff: { Icon: Navigation, className: "text-orange-600" },
  completed: { Icon: CheckCircle2, className: "text-slate-500" },
};

type LiveRideStatusIconProps = {
  status: LiveRideStatus;
  className?: string;
  size?: number;
};

export default function LiveRideStatusIcon({
  status,
  className = "",
  size = 14,
}: LiveRideStatusIconProps) {
  const { Icon, className: statusClassName } = STATUS_ICON_CONFIG[status];
  return (
    <Icon
      aria-hidden="true"
      className={`${statusClassName} ${className}`.trim()}
      size={size}
    />
  );
}
