import { cn } from "cn";

import { Badge } from "@/components/ui/badge";
import { TICKET_PRIORITY_LABELS } from "@/lib/supportTickets";
import type { SupportTicketPriority } from "@/lib/supportTickets";

export const ticketPriorityStyles: Record<SupportTicketPriority, string> = {
  urgent: "bg-rose-50 text-rose-700 ring-rose-600/20",
  high: "bg-amber-50 text-amber-700 ring-amber-600/20",
  normal: "bg-sky-50 text-sky-700 ring-sky-600/20",
  low: "bg-slate-100 text-slate-600 ring-slate-500/20",
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
