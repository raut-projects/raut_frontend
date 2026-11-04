import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import {
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
} from "@/lib/supportTickets";
import type {
  SupportTicketPriority,
  SupportTicketStatus,
} from "@/lib/supportTickets";

export const ticketPriorityStyles: Record<SupportTicketPriority, string> = {
  urgent: "bg-rose-50 text-rose-700 ring-rose-600/20",
  high: "bg-amber-50 text-amber-700 ring-amber-600/20",
  medium: "bg-sky-50 text-sky-700 ring-sky-600/20",
  low: "bg-slate-100 text-slate-600 ring-slate-500/20",
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

export function TicketPriorityBadge({
  priority,
  className,
}: {
  priority: SupportTicketPriority;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border-transparent px-2.5 ring-1 ring-inset",
        ticketPriorityStyles[priority],
        className,
      )}
    >
      {TICKET_PRIORITY_LABELS[priority]}
    </Badge>
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
