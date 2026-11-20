import { cn } from "cn";

import { Badge } from "@/components/ui/badge";
import {
  ADMIN_STATUS_LABELS,
  ADMIN_STATUS_TONES,
  normalizeAdminStatus,
  type AdminUserStatus,
} from "@/lib/adminUsers";
import {
  PROMOTION_STATUS_LABELS,
  type PromotionStatus,
} from "@/lib/marketing";
import {
  TICKET_STATUS_LABELS,
  type SupportTicketStatus,
} from "@/lib/supportTickets";
import type { StaffInvitationStatus } from "@/types/staff";

const INVITATION_STATUS_META: Record<
  StaffInvitationStatus,
  { label: string; tone: string; dot: string }
> = {
  pending: {
    label: "Pending",
    tone: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  accepted: {
    label: "Accepted",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelled",
    tone: "border-rose-200 bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
  },
  expired: {
    label: "Expired",
    tone: "border-slate-200 bg-slate-50 text-slate-600",
    dot: "bg-slate-400",
  },
};

const PROMOTION_STATUS_TONES: Record<PromotionStatus, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  scheduled: "border-sky-200 bg-sky-50 text-sky-700",
  expired: "border-slate-200 bg-slate-100 text-slate-600",
  draft: "border-amber-200 bg-amber-50 text-amber-700",
};

export const ticketStatusStyles: Record<SupportTicketStatus, string> = {
  open: "bg-amber-50 text-amber-700 ring-amber-600/20",
  "in-progress": "bg-sky-50 text-sky-700 ring-sky-600/20",
  resolved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  closed: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

export const ticketStatusDots: Record<SupportTicketStatus, string> = {
  open: "bg-amber-500",
  "in-progress": "bg-sky-500",
  resolved: "bg-emerald-500",
  closed: "bg-slate-400",
};

export function AdminUserStatusBadge({ status }: { status: AdminUserStatus }) {
  const normalized = normalizeAdminStatus(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${ADMIN_STATUS_TONES[normalized]}`}
    >
      <span
        className={`size-1.5 rounded-full ${
          normalized === "active"
            ? "bg-emerald-500"
            : normalized === "invited"
              ? "bg-amber-500"
              : "bg-slate-400"
        }`}
        aria-hidden="true"
      />
      {ADMIN_STATUS_LABELS[normalized]}
    </span>
  );
}

export function InvitationStatusBadge({
  status,
}: {
  status: StaffInvitationStatus;
}) {
  const meta = INVITATION_STATUS_META[status] ?? INVITATION_STATUS_META.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${meta.tone}`}
    >
      <span className={`size-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

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
        PROMOTION_STATUS_TONES[status],
        className,
      )}
    >
      {PROMOTION_STATUS_LABELS[status]}
    </span>
  );
}

export function TicketStatusBadge({
  status,
  className,
  showDot = true,
}: {
  status: SupportTicketStatus;
  className?: string;
  showDot?: boolean;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 rounded-full border-transparent px-2.5 ring-1 ring-inset",
        ticketStatusStyles[status],
        className,
      )}
    >
      {showDot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", ticketStatusDots[status])}
          aria-hidden="true"
        />
      )}
      {TICKET_STATUS_LABELS[status]}
    </Badge>
  );
}
