import { cn } from "cn";

import {
  PROMOTION_STATUS_LABELS,
  type PromotionStatus,
} from "@/lib/marketing";

const toneClasses: Record<PromotionStatus, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  scheduled: "border-sky-200 bg-sky-50 text-sky-700",
  expired: "border-slate-200 bg-slate-100 text-slate-600",
  draft: "border-amber-200 bg-amber-50 text-amber-700",
};

export function PromotionStatusBadge({
  status,
  className,
}: {
  status: PromotionStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        toneClasses[status],
        className,
      )}
    >
      {PROMOTION_STATUS_LABELS[status]}
    </span>
  );
}
