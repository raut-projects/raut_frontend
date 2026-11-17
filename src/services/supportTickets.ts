// Support ticket service for the backend Support Admin API.
//
// All ticket routes live under `/support/tickets/queue`. Every mutation sends
// the ticket `version` for optimistic concurrency, and priority changes and
// escalations require a reason/note. Ticket responses carry requester and
// assignee UUIDs only; the detail screen resolves requester context through
// the ticket context endpoint and assignee names through the agent directory.

import { API_ROUTES } from "@/lib/config";
import {
  deriveTicketHistory,
  TICKET_STATUS_VALUES,
} from "@/lib/supportTickets";
import type {
  SupportAgent,
  SupportTicket,
  SupportTicketDetail,
  SupportTicketFilters,
  SupportTicketMessage,
  SupportTicketPriority,
  SupportTicketRequesterType,
  SupportTicketSla,
  SupportTicketStatus,
  SupportTicketUser,
} from "@/lib/supportTickets";
import { apiGet, apiPatch, apiPost } from "./api";

type RecordValue = Record<string, unknown>;

export type SupportTicketListParams = SupportTicketFilters & {
  page?: number;
  limit?: number;
};

export type SupportTicketListResult = {
  items: SupportTicket[];
  total: number;
  page: number;
  limit: number;
};

export type CreateSupportTicketInput = {
  requesterId: string;
  subject: string;
  category: string;
  priority: SupportTicketPriority;
  description: string;
  rideId?: string;
};

export type SupportTicketMessageInput = {
  message: string;
  version: number;
  internal?: boolean;
};

const asRecord = (value: unknown): RecordValue =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordValue)
    : {};

const firstValue = (record: RecordValue, ...keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
};

const text = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

const truthy = (value: unknown) =>
  value === true || value === 1 || value === "true" || value === "1";

const requiredText = (record: RecordValue, ...keys: string[]) => {
  const value = text(firstValue(record, ...keys)).trim();
  if (!value) {
    throw new Error(`The support ticket response is missing ${keys[0]}.`);
  }
  return value;
};

const objectArray = (value: unknown): RecordValue[] =>
  Array.isArray(value) ? value.map(asRecord) : [];

const listItems = (data: unknown, ...keys: string[]) => {
  if (Array.isArray(data)) return objectArray(data);
  const record = asRecord(data);
  const items = firstValue(record, ...keys, "items", "results");
  return objectArray(items);
};

const normalizeStatus = (value: unknown): SupportTicketStatus => {
  const status = text(value).toLowerCase().replace(/-/g, "_");
  if (status === "open" || status === "new" || status === "pending") {
    return "open";
  }
  if (status === "in_progress" || status === "in progress")
    return "in-progress";
  if (status === "resolved") return "resolved";
  if (status === "closed") return "closed";
  return "open";
};

const normalizePriority = (value: unknown): SupportTicketPriority => {
  const priority = text(value).toLowerCase();
  if (priority === "urgent" || priority === "critical") return "urgent";
  if (priority === "high") return "high";
  if (priority === "normal" || priority === "medium") return "normal";
  if (priority === "low") return "low";
  return "normal";
};

const normalizeRequesterType = (value: unknown): SupportTicketRequesterType => {
  const type = text(value).toLowerCase();
  if (type === "driver") return "Driver";
  if (type === "rider" || type === "customer" || type === "passenger") {
    return "Rider";
  }
  return "Other";
};

const nameFrom = (value: unknown) => {
  if (typeof value === "string") return value;
  const record = asRecord(value);
  const direct = text(
    firstValue(record, "name", "full_name", "fullName", "display_name"),
  );
  if (direct) return direct;
  return [
    text(firstValue(record, "first_name", "firstName")),
    text(firstValue(record, "last_name", "lastName")),
  ]
    .filter(Boolean)
    .join(" ");
};

function mapSla(value: unknown): SupportTicketSla | undefined {
  const record = asRecord(value);
  const state = text(firstValue(record, "state", "status"));

  if (!state) return undefined;

  const elapsed = Number(
    firstValue(record, "elapsed_percent", "elapsedPercent"),
  );
  const remaining = Number(
    firstValue(record, "remaining_seconds", "remainingSeconds"),
  );

  return {
    state,
    color: text(firstValue(record, "color")) || undefined,
    elapsedPercent: Number.isFinite(elapsed) ? elapsed : undefined,
    targetAt: text(firstValue(record, "target_at", "targetAt")) || undefined,
    completedAt:
      text(firstValue(record, "completed_at", "completedAt")) || null,
    remainingSeconds: Number.isFinite(remaining) ? remaining : undefined,
  };
}

export function mapSupportTicket(value: unknown): SupportTicket {
  const record = asRecord(value);
  const assigneeId =
    text(firstValue(record, "assigned_to", "assignedTo", "assignee_id")) ||
    undefined;
  const slaSource = firstValue(record, "resolution_sla", "resolutionSla");

  return {
    id: requiredText(record, "id", "ticket_id", "ticketId"),
    subject: requiredText(record, "subject", "title"),
    description: text(firstValue(record, "description")) || undefined,
    requesterId: text(firstValue(record, "requester_id", "requesterId")),
    category: text(firstValue(record, "category")) || "Other issue",
    priority: normalizePriority(record.priority),
    status: normalizeStatus(record.status),
    assigneeId,
    version: Number(firstValue(record, "version")) || 0,
    rideId: text(firstValue(record, "ride_id", "rideId")) || undefined,
    incidentType:
      text(firstValue(record, "incident_type", "incidentType")) || undefined,
    contactPhone:
      text(firstValue(record, "contact_phone", "contactPhone")) || undefined,
    createdAt: text(firstValue(record, "created_at", "createdAt")),
    updatedAt: text(firstValue(record, "updated_at", "updatedAt")),
    firstResponseAt:
      text(firstValue(record, "first_response_at", "firstResponseAt")) ||
      undefined,
    resolvedAt:
      text(firstValue(record, "resolved_at", "resolvedAt")) || undefined,
    closedAt: text(firstValue(record, "closed_at", "closedAt")) || undefined,
    escalatedAt:
      text(firstValue(record, "escalated_at", "escalatedAt")) || undefined,
    responseSla: mapSla(firstValue(record, "response_sla", "responseSla")),
    resolutionSla: mapSla(slaSource),
  };
}

const mapMessageRole = (value: unknown): SupportTicketMessage["role"] => {
  const role = text(value).toLowerCase();
  if (role === "driver") return "Driver";
  if (role === "rider" || role === "customer" || role === "passenger") {
    return "Rider";
  }
  if (role === "bot" || role === "assistant") return "Bot";
  if (role === "system") return "System";
  return "Agent";
};

function mapSupportTicketMessage(value: unknown): SupportTicketMessage {
  const record = asRecord(value);
  const role = mapMessageRole(
    firstValue(record, "sender_role", "senderRole", "role", "author_type"),
  );

  return {
    id: requiredText(record, "id", "message_id", "messageId"),
    author:
      text(firstValue(record, "author_name", "authorName")) ||
      // text(firstValue(record, "sender_id", "senderId")) ||
      role,
    role,
    body: requiredText(record, "body", "message", "content", "text"),
    createdAt: text(firstValue(record, "created_at", "createdAt", "sent_at")),
    internal: truthy(firstValue(record, "is_internal", "isInternal")),
    senderId: text(firstValue(record, "sender_id", "senderId")) || undefined,
  };
}

/**
 * Maps the ticket context response. The Support Admin API does not publish a
 * schema for this endpoint, so the mapper accepts the plausible container keys
 * and falls back to the raw payload.
 */
function mapTicketUser(value: unknown): SupportTicketUser {
  const record = asRecord(value);
  const nested =
    firstValue(record, "requester", "user", "customer", "driver") ?? record;
  const user = asRecord(nested);

  const ratingValue = firstValue(user, "rating", "average_rating");
  const ridesValue = firstValue(user, "total_rides", "rides_count");
  const rating = Number(ratingValue);
  const totalRides = Number(ridesValue);

  const typeValue = firstValue(
    user,
    "user_type",
    "requester_type",
    "type",
    "role",
  );

  return {
    name:
      nameFrom(user) ||
      text(firstValue(record, "requester_name", "requesterName")) ||
      undefined,
    accountId:
      text(firstValue(user, "account_id", "accountId", "id")) || undefined,
    phone:
      text(firstValue(user, "phone", "phone_number", "phoneNumber")) ||
      undefined,
    joinedAt:
      text(firstValue(user, "joined_at", "joinedAt", "created_at")) ||
      undefined,
    totalRides:
      Number.isFinite(totalRides) && ridesValue !== undefined
        ? totalRides
        : undefined,
    rating:
      Number.isFinite(rating) && ratingValue !== undefined ? rating : undefined,
    type: typeValue ? normalizeRequesterType(typeValue) : undefined,
  };
}

function mapAgent(value: unknown): SupportAgent | null {
  const record = asRecord(value);
  const id = text(
    firstValue(record, "id", "agent_id", "agentId", "user_id", "userId"),
  );

  if (!id) return null;

  const name =
    nameFrom(record) || text(firstValue(record, "email", "username")) || id;
  const roleValue = firstValue(
    record,
    "role",
    "role_name",
    "roles",
    "permission",
  );
  const role = Array.isArray(roleValue)
    ? roleValue
        .map((item) =>
          typeof item === "string"
            ? item
            : nameFrom(item) || text(firstValue(asRecord(item), "key")),
        )
        .filter(Boolean)
        .join(", ")
    : text(roleValue) || "Support";

  return {
    id,
    name,
    role,
    regionId: text(firstValue(record, "region_id", "regionId")) || undefined,
  };
}

export async function listSupportTickets(
  params: SupportTicketListParams = {},
): Promise<SupportTicketListResult> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 25;
  const data = await apiGet(API_ROUTES.supportTickets, {
    params: {
      page,
      page_size: limit,
      status:
        params.status && params.status !== "all"
          ? TICKET_STATUS_VALUES[params.status]
          : undefined,
      priority:
        params.priority && params.priority !== "all"
          ? params.priority
          : undefined,
      category:
        params.category && params.category !== "all"
          ? params.category
          : undefined,
      assigned_to:
        params.assignee &&
        params.assignee !== "all" &&
        params.assignee !== "unassigned"
          ? params.assignee
          : undefined,
      requester_id: params.requesterId || undefined,
      include_unassigned: params.includeUnassigned ? true : undefined,
    },
  });

  const record = asRecord(data);
  const items = listItems(data, "tickets").map(mapSupportTicket);
  const pagination = asRecord(
    record.pagination ?? asRecord(record.meta).pagination,
  );
  const total = Number(
    firstValue(pagination, "total_items", "total_count", "total") ??
      firstValue(record, "total", "total_count", "total_items") ??
      items.length,
  );

  return {
    items,
    total: Number.isFinite(total) ? total : items.length,
    page,
    limit,
  };
}

export async function listSupportAgents(): Promise<SupportAgent[]> {
  const data = await apiGet(API_ROUTES.supportAgents);

  return listItems(data, "agents", "eligible_agents")
    .map(mapAgent)
    .filter((agent): agent is SupportAgent => Boolean(agent));
}

export async function getSupportTicketContext(
  ticketId: string,
): Promise<SupportTicketUser> {
  const data = await apiGet(API_ROUTES.supportTicketContext(ticketId));

  return mapTicketUser(data);
}

export async function getSupportTicket(ticketId: string) {
  const data = await apiGet(API_ROUTES.supportTicket(ticketId));
  const record = asRecord(data);
  const ticketRecord = firstValue(record, "ticket") ?? data;

  return mapSupportTicket(ticketRecord);
}

export async function listSupportTicketMessages(
  ticketId: string,
  params: { page?: number; limit?: number } = {},
) {
  const data = await apiGet(API_ROUTES.supportTicketMessages(ticketId), {
    params: {
      page: params.page ?? 1,
      page_size: params.limit ?? 50,
    },
  });

  return listItems(data, "messages").map(mapSupportTicketMessage);
}

export async function getSupportTicketDetail(ticketId: string) {
  const [ticket, context] = await Promise.all([
    getSupportTicket(ticketId),
    getSupportTicketContext(ticketId).catch(() => ({}) as SupportTicketUser),
  ]);

  let messages: SupportTicketMessage[] = [];

  try {
    messages = await listSupportTicketMessages(ticketId);
  } catch {
    messages = [];
  }

  const detail: SupportTicketDetail = {
    ticketId: ticket.id,
    user: {
      ...context,
      name: context.name || ticket.requesterId,
      type: context.type || ticket.requesterType,
    },
    rideId: ticket.rideId,
    sla: ticket.resolutionSla ?? ticket.responseSla,
    messages,
    history: deriveTicketHistory(ticket),
  };

  return { ticket, detail };
}

export async function createSupportTicket(input: CreateSupportTicketInput) {
  const data = await apiPost(API_ROUTES.supportTickets, {
    requester_id: input.requesterId.trim(),
    category: input.category,
    priority: input.priority,
    subject: input.subject.trim(),
    description: input.description.trim(),
    ride_id: input.rideId?.trim() || undefined,
  });
  const record = asRecord(data);
  const created = asRecord(firstValue(record, "ticket") ?? data);
  const ticketId =
    text(firstValue(created, "id", "ticket_id", "ticketId", "reference")) ||
    (typeof data === "string" || typeof data === "number" ? String(data) : "");

  if (!ticketId) {
    throw new Error("The create-ticket response did not include a ticket ID.");
  }

  return ticketId;
}

export async function addSupportTicketMessage(
  ticketId: string,
  input: SupportTicketMessageInput,
) {
  return apiPost(API_ROUTES.supportTicketMessages(ticketId), {
    message: input.message.trim(),
    version: input.version,
    is_internal: Boolean(input.internal),
  });
}

export async function assignSupportTicket(
  ticketId: string,
  agentId: string,
  version: number,
) {
  return apiPatch(API_ROUTES.supportTicketAssignment(ticketId), {
    assigned_to: agentId,
    version,
  });
}

export async function claimSupportTicket(ticketId: string, version: number) {
  return apiPost(API_ROUTES.supportTicketAssignToMe(ticketId), { version });
}

export async function updateSupportTicketStatus(
  ticketId: string,
  status: SupportTicketStatus,
  version: number,
  note?: string,
) {
  return apiPatch(API_ROUTES.supportTicketStatus(ticketId), {
    status: TICKET_STATUS_VALUES[status],
    version,
    note: note?.trim() || undefined,
  });
}

export async function updateSupportTicketPriority(
  ticketId: string,
  priority: SupportTicketPriority,
  version: number,
  reason: string,
) {
  return apiPatch(API_ROUTES.supportTicketPriority(ticketId), {
    priority,
    version,
    reason: reason.trim(),
  });
}

export async function escalateSupportTicket(
  ticketId: string,
  version: number,
  note: string,
) {
  return apiPost(API_ROUTES.supportTicketEscalate(ticketId), {
    version,
    note: note.trim(),
  });
}
