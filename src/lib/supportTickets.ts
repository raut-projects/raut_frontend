// Support ticket types and helpers for the admin support screens. The shapes
// mirror the backend Support Admin API: tickets carry a `version` for
// optimistic concurrency, requester/assignee are UUIDs, and SLA progress is
// reported as response/resolution SLA objects.

export type SupportTicketStatus =
  | "open"
  | "in-progress"
  | "resolved"
  | "closed";

export type SupportTicketPriority = "urgent" | "high" | "normal" | "low";

export type SupportTicketRequesterType = "Rider" | "Driver" | "Other";

/** SLA progress for the response or resolution target. */
export type SupportTicketSla = {
  state: string;
  color?: string;
  elapsedPercent?: number;
  targetAt?: string;
  completedAt?: string | null;
  remainingSeconds?: number;
};

export type SupportTicket = {
  id: string;
  subject: string;
  description?: string;
  requesterId: string;
  requesterType?: SupportTicketRequesterType;
  category: string;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  assigneeId?: string;
  version: number;
  rideId?: string;
  incidentType?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
  firstResponseAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  escalatedAt?: string;
  responseSla?: SupportTicketSla;
  resolutionSla?: SupportTicketSla;
};

/** Requester context returned by the ticket context endpoint. */
export type SupportTicketUser = {
  name?: string;
  accountId?: string;
  phone?: string;
  joinedAt?: string;
  totalRides?: number;
  rating?: number;
  type?: SupportTicketRequesterType;
};

export type SupportTicketMessageRole =
  | SupportTicketRequesterType
  | "System"
  | "Bot"
  | "Agent";

export type SupportTicketMessage = {
  id: string;
  author: string;
  role: SupportTicketMessageRole;
  body: string;
  createdAt: string;
  internal?: boolean;
  senderId?: string;
};

export type SupportTicketHistoryEntry = {
  id: string;
  label: string;
  createdAt: string;
  actor: string;
};

export type SupportTicketDetail = {
  ticketId: string;
  user: SupportTicketUser;
  rideId?: string;
  sla?: SupportTicketSla;
  messages: SupportTicketMessage[];
  history: SupportTicketHistoryEntry[];
};

export type SupportAgent = {
  id: string;
  name: string;
  role: string;
  regionId?: string;
};

export type SupportTicketFilters = {
  status?: SupportTicketStatus | "all";
  priority?: SupportTicketPriority | "all";
  category?: string;
  /** Agent UUID, "all", or "unassigned". */
  assignee?: string;
  requesterId?: string;
  includeUnassigned?: boolean;
};

export const TICKET_STATUS_LABELS: Record<SupportTicketStatus, string> = {
  open: "Open",
  "in-progress": "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

export const TICKET_PRIORITY_LABELS: Record<SupportTicketPriority, string> = {
  urgent: "Urgent",
  high: "High",
  normal: "Normal",
  low: "Low",
};

export const SUPPORT_TICKET_PRIORITIES: SupportTicketPriority[] = [
  "urgent",
  "high",
  "normal",
  "low",
];

// TicketCategory enum from the backend Support Admin API.
export const SUPPORT_TICKET_CATEGORIES = [
  "App crashes or technical issues",
  "Payment problems",
  "Driver behavior complaint",
  "Safety concern",
  "Account or login issues",
  "Feature request or suggestion",
  "Other issue",
  "Ride Issues",
  "Document Verification",
];

/** TicketStatus enum values as stored by the backend. */
export const TICKET_STATUS_VALUES: Record<SupportTicketStatus, string> = {
  open: "open",
  "in-progress": "in_progress",
  resolved: "resolved",
  closed: "closed",
};

export function formatTicketUpdated(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export function formatTicketDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export function formatTicketJoinedDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Formats a remaining SLA countdown from seconds. */
export function formatTicketSlaSeconds(seconds: number) {
  if (!Number.isFinite(seconds)) return "-";

  const absolute = Math.max(0, Math.round(seconds));

  if (absolute < 60) return `${absolute}s`;

  const minutes = Math.floor(absolute / 60);

  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"}`;

  const days = Math.floor(hours / 24);

  return `${days} day${days === 1 ? "" : "s"}`;
}

/** Resolves an assignee display name from the agent directory. */
export function ticketAgentName(
  ticket: Pick<SupportTicket, "assigneeId">,
  agents: SupportAgent[],
) {
  if (!ticket.assigneeId) return "Unassigned";

  return (
    agents.find((agent) => agent.id === ticket.assigneeId)?.name ?? "Assigned"
  );
}

/**
 * Builds a timeline from the ticket's recorded timestamps. The Support Admin
 * API has no history endpoint, so the panel derives events from status
 * transitions.
 */
export function deriveTicketHistory(
  ticket: Pick<
    SupportTicket,
    "createdAt" | "firstResponseAt" | "escalatedAt" | "resolvedAt" | "closedAt"
  >,
): SupportTicketHistoryEntry[] {
  const entries: SupportTicketHistoryEntry[] = [
    {
      id: "created",
      label: "Ticket created",
      createdAt: ticket.createdAt,
      actor: "Requester",
    },
  ];

  if (ticket.firstResponseAt) {
    entries.push({
      id: "first-response",
      label: "First response sent",
      createdAt: ticket.firstResponseAt,
      actor: "Support",
    });
  }

  if (ticket.escalatedAt) {
    entries.push({
      id: "escalated",
      label: "Escalated to platform managers",
      createdAt: ticket.escalatedAt,
      actor: "Support",
    });
  }

  if (ticket.resolvedAt) {
    entries.push({
      id: "resolved",
      label: "Ticket resolved",
      createdAt: ticket.resolvedAt,
      actor: "Support",
    });
  }

  if (ticket.closedAt) {
    entries.push({
      id: "closed",
      label: "Ticket closed",
      createdAt: ticket.closedAt,
      actor: "Support",
    });
  }

  return entries;
}

const csvEscape = (value: unknown) => {
  const text = value === null || value === undefined ? "" : String(value);

  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const csvRow = (...cells: unknown[]) => cells.map(csvEscape).join(",");

export function buildSupportTicketsCsv(
  tickets: SupportTicket[],
  agents: SupportAgent[] = [],
) {
  return [
    csvRow(
      "Ticket ID",
      "Subject",
      "Requester ID",
      "Category",
      "Priority",
      "Status",
      "Assigned To",
      "Created",
      "Updated",
    ),
    ...tickets.map((ticket) =>
      csvRow(
        ticket.id,
        ticket.subject,
        ticket.requesterId,
        ticket.category,
        TICKET_PRIORITY_LABELS[ticket.priority],
        TICKET_STATUS_LABELS[ticket.status],
        ticketAgentName(ticket, agents),
        ticket.createdAt,
        ticket.updatedAt,
      ),
    ),
  ].join("\n");
}

export function downloadSupportTicketsCsv(
  tickets: SupportTicket[],
  agents: SupportAgent[] = [],
) {
  const content = buildSupportTicketsCsv(tickets, agents);
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `raut-support-tickets-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
