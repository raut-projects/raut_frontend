export type SupportTicketStatus = "open" | "in-progress" | "resolved" | "closed";

export type SupportTicketPriority = "urgent" | "high" | "medium" | "low";

export type SupportTicketRequesterType = "Rider" | "Driver" | "Other";

export type SupportTicket = {
  id: string;
  subject: string;
  requester: string;
  requesterType: SupportTicketRequesterType;
  category: string;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  assignee: string;
  assigneeId?: string;
  createdAt: string;
  updatedAt: string;
};

export type SupportTicketUser = {
  name: string;
  accountId?: string;
  phone?: string;
  joinedAt?: string;
  totalRides?: number;
  rating?: number;
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
  rideId?: string;
  attachments?: string[];
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
  slaMinutes?: number;
  messages: SupportTicketMessage[];
  history: SupportTicketHistoryEntry[];
};

export type SupportAgent = {
  id: string;
  name: string;
  role: string;
};

export type SupportTicketFilters = {
  search?: string;
  status?: SupportTicketStatus | "all";
  priority?: SupportTicketPriority | "all";
  category?: string;
  assignee?: string;
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
  medium: "Medium",
  low: "Low",
};

export const SUPPORT_TICKET_PRIORITIES: SupportTicketPriority[] = [
  "urgent",
  "high",
  "medium",
  "low",
];

export const SUPPORT_TICKET_CATEGORIES = [
  "Account",
  "App problem",
  "Driver conduct",
  "Driver issue",
  "Driver onboarding",
  "Lost item",
  "Payment",
  "Payout",
  "Promotion",
  "Ride issue",
  "Route issue",
  "Safety",
];

export const SUPPORT_TICKET_ASSIGNEES = [
  "Unassigned",
  "Asha Kileo",
  "Baraka Mrema",
  "Daniel Mwakyusa",
  "Neema Mushi",
  "Rehema Msuya",
];

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

export function formatTicketSla(minutes: number) {
  if (minutes < 60) return `${minutes} min`;

  const hours = minutes / 60;

  return `${hours} hr${hours === 1 ? "" : "s"}`;
}

const csvEscape = (value: unknown) => {
  const text = value === null || value === undefined ? "" : String(value);

  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const csvRow = (...cells: unknown[]) => cells.map(csvEscape).join(",");

export function buildSupportTicketsCsv(tickets: SupportTicket[]) {
  return [
    csvRow(
      "Ticket ID",
      "Subject",
      "Requester",
      "Requester type",
      "Category",
      "Priority",
      "Status",
      "Assigned to",
      "Created",
      "Updated",
    ),
    ...tickets.map((ticket) =>
      csvRow(
        ticket.id,
        ticket.subject,
        ticket.requester,
        ticket.requesterType,
        ticket.category,
        TICKET_PRIORITY_LABELS[ticket.priority],
        TICKET_STATUS_LABELS[ticket.status],
        ticket.assignee,
        ticket.createdAt,
        ticket.updatedAt,
      ),
    ),
  ].join("\n");
}

export function downloadSupportTicketsCsv(tickets: SupportTicket[]) {
  const content = buildSupportTicketsCsv(tickets);
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
