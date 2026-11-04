export type SupportTicketStatus = "open" | "in-progress" | "resolved" | "closed";

export type SupportTicketPriority = "urgent" | "high" | "medium" | "low";

export type SupportTicketRequesterType = "Rider" | "Driver";

export type SupportTicket = {
  id: string;
  subject: string;
  requester: string;
  requesterType: SupportTicketRequesterType;
  category: string;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  assignee: string;
  createdAt: string;
  updatedAt: string;
};

export type SupportTicketUser = {
  name: string;
  accountId: string;
  phone: string;
  joinedAt: string;
  totalRides: number;
  rating: number;
};

export type SupportTicketMessageRole =
  | SupportTicketRequesterType
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
  rideId: string;
  slaMinutes: number;
  messages: SupportTicketMessage[];
  history: SupportTicketHistoryEntry[];
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

export const SUPPORT_TICKET_SLA_MINUTES: Record<
  SupportTicketPriority,
  number
> = {
  urgent: 8,
  high: 30,
  medium: 120,
  low: 240,
};

export const SUPPORT_TICKET_ASSIGNEES = [
  "Unassigned",
  "Asha Kileo",
  "Baraka Mrema",
  "Daniel Mwakyusa",
  "Neema Mushi",
  "Rehema Msuya",
];

const TICKET_TEMPLATES = [
  {
    subject: "Driver took a longer route than expected",
    category: "Ride issue",
  },
  {
    subject: "Duplicate charge on mobile money payment",
    category: "Payment",
  },
  {
    subject: "Unable to update phone number on account",
    category: "Account",
  },
  {
    subject: "Driver ended the trip before the destination",
    category: "Ride issue",
  },
  {
    subject: "Lost a bag inside the vehicle",
    category: "Lost item",
  },
  {
    subject: "Payout has been pending for two days",
    category: "Payout",
  },
  {
    subject: "App keeps closing when opening trip history",
    category: "App problem",
  },
  {
    subject: "Driver was not polite during the trip",
    category: "Driver conduct",
  },
  {
    subject: "Fare charged does not match the estimate",
    category: "Payment",
  },
  {
    subject: "Verification documents were rejected",
    category: "Driver onboarding",
  },
  {
    subject: "Cannot sign in after changing my password",
    category: "Account",
  },
  {
    subject: "Route was cancelled without any notification",
    category: "Route issue",
  },
  {
    subject: "Passenger did not show up at the pickup point",
    category: "Driver issue",
  },
  {
    subject: "Refund has not reached my wallet",
    category: "Payment",
  },
  {
    subject: "Map location is pinned on the wrong street",
    category: "App problem",
  },
  {
    subject: "Driver account is still marked as suspended",
    category: "Driver onboarding",
  },
  {
    subject: "Vehicle details need to be corrected",
    category: "Account",
  },
  {
    subject: "Safety concern during a night trip",
    category: "Safety",
  },
  {
    subject: "Promo code was not applied to the fare",
    category: "Promotion",
  },
  {
    subject: "Trip receipt is missing from the app",
    category: "Ride issue",
  },
  {
    subject: "Driver asked for payment outside the app",
    category: "Driver conduct",
  },
  {
    subject: "Mobile network change is not saving",
    category: "Payout",
  },
  {
    subject: "Passenger left an item in my vehicle",
    category: "Lost item",
  },
  {
    subject: "OTP code is not arriving on my phone",
    category: "Account",
  },
];

const REQUESTERS = [
  "Amina Hassan",
  "Joseph Mushi",
  "Grace Mwakalinga",
  "Hamisi Juma",
  "Neema Mushi",
  "Peter Kimaro",
  "Saida Mwinyi",
  "Baraka Mrema",
  "Esther Lyimo",
  "Musa Kileo",
  "Rehema Msuya",
  "Daniel Mwakyusa",
  "Asha Kileo",
  "Juma Shabani",
  "Fatuma Ally",
  "Michael Mushi",
  "Zawadi Mrema",
  "Elia Mwakalinga",
  "Halima Said",
  "Emmanuel Kimaro",
  "Sophia Mwinyi",
  "Abdul Juma",
  "Rose Lyimo",
  "Patrick Mrema",
];

const STATUS_SEQUENCE: SupportTicketStatus[] = [
  "open",
  "in-progress",
  "resolved",
  "closed",
  "open",
  "resolved",
  "in-progress",
  "closed",
  "open",
];

const PRIORITY_SEQUENCE: SupportTicketPriority[] = [
  "high",
  "medium",
  "low",
  "medium",
  "high",
  "low",
  "medium",
  "high",
  "low",
];

export const SUPPORT_TICKET_CATEGORIES = Array.from(
  new Set(TICKET_TEMPLATES.map((template) => template.category)),
).sort();

const MOCK_NOW = new Date("2026-11-04T18:30:00.000Z").getTime();

const TICKET_COUNT = 342;

const URGENT_TICKET_COUNT = 5;

export function createSupportTickets(): SupportTicket[] {
  return Array.from({ length: TICKET_COUNT }, (_, index) => {
    const template = TICKET_TEMPLATES[index % TICKET_TEMPLATES.length];
    const requester = REQUESTERS[index % REQUESTERS.length];
    const priority =
      index < URGENT_TICKET_COUNT
        ? "urgent"
        : PRIORITY_SEQUENCE[index % PRIORITY_SEQUENCE.length];
    const status =
      index < URGENT_TICKET_COUNT
        ? "open"
        : STATUS_SEQUENCE[index % STATUS_SEQUENCE.length];
    const assignee =
      status !== "closed" && index % 4 === 0
        ? "Unassigned"
        : SUPPORT_TICKET_ASSIGNEES[
            (index % (SUPPORT_TICKET_ASSIGNEES.length - 1)) + 1
          ];
    const updatedAt = new Date(
      MOCK_NOW - index * 47 * 60 * 1000,
    ).toISOString();
    const createdAt = new Date(
      MOCK_NOW - index * 47 * 60 * 1000 - (3 + (index % 10)) * 60 * 60 * 1000,
    ).toISOString();

    return {
      id: `T-${String(TICKET_COUNT - index).padStart(3, "0")}`,
      subject: template.subject,
      requester,
      requesterType: index % 3 === 0 ? "Driver" : "Rider",
      category: template.category,
      priority,
      status,
      assignee,
      createdAt,
      updatedAt,
    };
  });
}

const TICKET_PHONE_PREFIXES = ["652", "713", "754", "784", "622", "719"];

const CATEGORY_MESSAGES: Record<string, string> = {
  Account:
    "I am having trouble with my account details and I cannot complete the update in the app.",
  "App problem":
    "The app keeps closing whenever I open this part of the app. I have already tried restarting it.",
  "Driver conduct":
    "I want to report how the driver behaved during my trip. Please review what happened.",
  "Driver issue":
    "There is an issue with the driver assigned to my trip and I need help resolving it.",
  "Driver onboarding":
    "My driver onboarding request is still blocked and I have not received a clear reason.",
  "Lost item":
    "I left an item in the vehicle and I need help contacting the driver to recover it.",
  Payment:
    'I tried to pay for my ride but it keeps failing. The app says "Payment gateway error". My M-Pesa balance is sufficient.',
  Payout:
    "My payout has been pending for two days. Please help me check what is blocking it.",
  Promotion:
    "A promotion was applied to my trip but the discount did not appear on the final fare.",
  "Ride issue":
    "Something went wrong during my recent ride and the trip details do not look correct.",
  "Route issue":
    "My route was cancelled without any notification and I need to understand why.",
  Safety:
    "I have a safety concern from a recent trip and I would like it reviewed urgently.",
};

const getTicketNumber = (ticket: SupportTicket) => {
  const parsed = Number(ticket.id.replace(/\D/g, ""));

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const addMinutes = (value: string, minutes: number) =>
  new Date(new Date(value).getTime() + minutes * 60 * 1000).toISOString();

const buildTicketUser = (ticket: SupportTicket): SupportTicketUser => {
  const number = getTicketNumber(ticket);
  const accountNumber = 108 + number;
  const prefix = TICKET_PHONE_PREFIXES[number % TICKET_PHONE_PREFIXES.length];
  const middle = String(600 + ((number * 37) % 400)).padStart(3, "0");
  const ending = String(100 + ((number * 73) % 900)).padStart(3, "0");

  return {
    name: ticket.requester,
    accountId: `${ticket.requesterType === "Driver" ? "D" : "R"}-${accountNumber}`,
    phone: `+255 ${prefix} ${middle} ${ending}`,
    joinedAt: new Date(
      Date.UTC(2025, number % 12, 1 + (number % 27)),
    ).toISOString(),
    totalRides: 12 + ((number * 17) % 240),
    rating: Number((4.5 + (number % 5) * 0.1).toFixed(1)),
  };
};

const buildRideId = (ticket: SupportTicket) => {
  const number = getTicketNumber(ticket);

  return `RD-${8000 + ((number * 19 + 4) % 2000)}`;
};

const buildOpeningMessage = (ticket: SupportTicket, rideId: string) => {
  const message =
    CATEGORY_MESSAGES[ticket.category] ??
    `I need help with this issue: ${ticket.subject.toLowerCase()}.`;

  return `${message} Ride ID: ${rideId}`;
};

const buildTicketHistory = (
  ticket: SupportTicket,
): SupportTicketHistoryEntry[] => {
  const history: SupportTicketHistoryEntry[] = [
    {
      id: `${ticket.id}-created`,
      label: `Ticket created by ${ticket.requester}`,
      createdAt: ticket.createdAt,
      actor: ticket.requester,
    },
  ];

  if (ticket.assignee !== "Unassigned") {
    history.push({
      id: `${ticket.id}-assigned`,
      label: `Assigned to ${ticket.assignee}`,
      createdAt: addMinutes(ticket.createdAt, 15),
      actor: "System",
    });
  }

  history.push({
    id: `${ticket.id}-status`,
    label: `Status changed to ${TICKET_STATUS_LABELS[ticket.status]} by System`,
    createdAt: ticket.updatedAt,
    actor: "System",
  });

  return history.sort((first, second) =>
    first.createdAt.localeCompare(second.createdAt),
  );
};

export function createSupportTicketDetail(
  ticket: SupportTicket,
): SupportTicketDetail {
  const rideId = buildRideId(ticket);
  const botMessageAt = addMinutes(ticket.createdAt, 1);

  return {
    ticketId: ticket.id,
    user: buildTicketUser(ticket),
    rideId,
    slaMinutes: SUPPORT_TICKET_SLA_MINUTES[ticket.priority],
    messages: [
      {
        id: `${ticket.id}-message-1`,
        author: ticket.requester,
        role: ticket.requesterType,
        body: buildOpeningMessage(ticket, rideId),
        createdAt: ticket.createdAt,
        rideId,
      },
      {
        id: `${ticket.id}-message-2`,
        author: "Raut Assistant",
        role: "Bot",
        body: `Thank you for reporting this issue. A support agent will assist you shortly. Reference: ${rideId}`,
        createdAt: botMessageAt,
        rideId,
      },
    ],
    history: buildTicketHistory(ticket),
  };
}

export function filterSupportTickets(
  tickets: SupportTicket[],
  filters: SupportTicketFilters = {},
): SupportTicket[] {
  const query = String(filters.search ?? "").trim().toLowerCase();
  const status = filters.status ?? "all";
  const priority = filters.priority ?? "all";
  const category = filters.category ?? "all";
  const assignee = filters.assignee ?? "all";

  return tickets
    .filter((ticket) => {
      if (status !== "all" && ticket.status !== status) return false;
      if (priority !== "all" && ticket.priority !== priority) return false;
      if (category !== "all" && ticket.category !== category) return false;
      if (assignee !== "all" && ticket.assignee !== assignee) return false;

      if (!query) return true;

      return [
        ticket.id,
        ticket.subject,
        ticket.requester,
        ticket.requesterType,
        ticket.category,
        ticket.priority,
        TICKET_STATUS_LABELS[ticket.status],
        ticket.assignee,
      ].some((value) => value.toLowerCase().includes(query));
    })
    .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
}

export function countSupportTicketsByStatus(tickets: SupportTicket[]) {
  const counts: Record<SupportTicketStatus | "all", number> = {
    all: tickets.length,
    open: 0,
    "in-progress": 0,
    resolved: 0,
    closed: 0,
  };

  tickets.forEach((ticket) => {
    counts[ticket.status] += 1;
  });

  return counts;
}

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
