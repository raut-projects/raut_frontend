import { API_ROUTES } from "@/lib/config";
import type {
  SupportAgent,
  SupportTicket,
  SupportTicketDetail,
  SupportTicketFilters,
  SupportTicketHistoryEntry,
  SupportTicketMessage,
  SupportTicketPriority,
  SupportTicketRequesterType,
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
  requesterType: SupportTicketRequesterType;
  subject: string;
  category: string;
  priority: SupportTicketPriority;
  message: string;
};

export type SupportTicketMessageInput = {
  body: string;
  internal: boolean;
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
  const status = text(value).toLowerCase().replace(/_/g, "-");
  if (status === "open" || status === "new" || status === "pending") {
    return "open";
  }
  if (status === "in-progress" || status === "in progress") return "in-progress";
  if (status === "resolved") return "resolved";
  if (status === "closed") return "closed";
  throw new Error(`Unsupported support ticket status: ${status || "missing"}.`);
};

const normalizePriority = (value: unknown): SupportTicketPriority => {
  const priority = text(value).toLowerCase();
  if (priority === "urgent" || priority === "critical") return "urgent";
  if (priority === "high") return "high";
  if (priority === "medium" || priority === "normal") return "medium";
  if (priority === "low") return "low";
  throw new Error(`Unsupported support ticket priority: ${priority || "missing"}.`);
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

export function mapSupportTicket(value: unknown): SupportTicket {
  const record = asRecord(value);
  const requesterValue = firstValue(record, "requester", "user", "customer");
  const requester = asRecord(requesterValue);
  const assignee = firstValue(record, "assignee", "assigned_to", "agent");
  const assigneeRecord = asRecord(assignee);
  const requesterName =
    nameFrom(firstValue(record, "requester_name", "requesterName")) ||
    nameFrom(requesterValue) ||
    text(firstValue(record, "customer_name", "user_name", "userName"));
  const assigneeName =
    nameFrom(assignee) ||
    text(firstValue(record, "assignee_name", "assigned_to_name"));
  const assigneeId =
    text(
      firstValue(assigneeRecord, "id", "agent_id", "user_id") ??
        firstValue(
          record,
          "assignee_id",
          "assigneeId",
          "assigned_to_id",
          "assignedToId",
        ),
    ) || undefined;
  const priority = normalizePriority(record.priority);

  if (!requesterName) {
    throw new Error("The support ticket response is missing requester name.");
  }

  return {
    id: requiredText(record, "id", "ticket_id", "reference"),
    subject: requiredText(record, "subject", "title"),
    requester: requesterName,
    requesterType: normalizeRequesterType(
      firstValue(
        record,
        "requester_type",
        "requesterType",
        "user_type",
        "userType",
      ) ??
        firstValue(requester, "type", "role"),
    ),
    category:
      text(firstValue(record, "category", "issue_type")) ||
      nameFrom(firstValue(record, "category")) ||
      "Other",
    priority,
    status: normalizeStatus(record.status),
    assignee: assigneeName || (assigneeId ? "Assigned" : "Unassigned"),
    assigneeId,
    createdAt: text(firstValue(record, "created_at", "createdAt")),
    updatedAt: text(firstValue(record, "updated_at", "updatedAt")),
  };
}

const mapTicketUser = (
  value: unknown,
  requester: string,
): SupportTicketUser => {
  const record = asRecord(value);
  const ratingValue = firstValue(record, "rating", "average_rating");
  const ridesValue = firstValue(record, "total_rides", "rides_count");
  const rating = Number(ratingValue);
  const totalRides = Number(ridesValue);

  return {
    name: nameFrom(record) || requester,
    accountId:
      text(firstValue(record, "account_id", "accountId", "id")) || undefined,
    phone:
      text(firstValue(record, "phone", "phone_number", "phoneNumber")) ||
      undefined,
    joinedAt:
      text(firstValue(record, "joined_at", "joinedAt", "created_at")) ||
      undefined,
    totalRides:
      Number.isFinite(totalRides) && ridesValue !== undefined
        ? totalRides
        : undefined,
    rating:
      Number.isFinite(rating) && ratingValue !== undefined
        ? rating
        : undefined,
  };
};

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
  const authorValue = firstValue(record, "author", "sender", "user");
  const author = nameFrom(authorValue) || text(record.author_name) || "Unknown";
  const attachments = Array.isArray(record.attachments)
    ? record.attachments
        .map((attachment) =>
          typeof attachment === "string"
            ? attachment
            : text(firstValue(asRecord(attachment), "name", "filename", "url")),
        )
        .filter(Boolean)
    : [];

  return {
    id: requiredText(record, "id", "message_id", "messageId"),
    author,
    role: mapMessageRole(
      firstValue(record, "role", "author_type", "sender_type", "senderType"),
    ),
    body: requiredText(record, "body", "message", "content", "text"),
    createdAt: text(
      firstValue(record, "created_at", "createdAt", "sent_at"),
    ),
    internal: truthy(firstValue(record, "is_internal", "internal")) || undefined,
    rideId: text(firstValue(record, "ride_id", "rideId")) || undefined,
    attachments: attachments.length ? attachments : undefined,
  };
}

function mapHistory(value: unknown): SupportTicketHistoryEntry[] {
  return objectArray(value).flatMap((record, index) => {
    const label = text(
      firstValue(record, "label", "description", "action", "event"),
    );
    if (!label) return [];

    const createdAt = text(firstValue(record, "created_at", "createdAt"));
    return [
      {
        id:
          text(firstValue(record, "id", "event_id")) ||
          `${createdAt || "history"}-${index}`,
        label,
        createdAt,
        actor:
          nameFrom(firstValue(record, "actor", "user")) ||
          text(firstValue(record, "actor_name")) ||
          "System",
      },
    ];
  });
}

const ticketDetailRecord = (value: unknown) => {
  const record = asRecord(value);
  const ticket = firstValue(record, "ticket");
  return ticket === undefined ? record : asRecord(ticket);
};

export async function listSupportTickets(
  params: SupportTicketListParams = {},
): Promise<SupportTicketListResult> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 25;
  const data = await apiGet(API_ROUTES.supportTickets, {
    params: {
      page,
      page_size: limit,
      search: params.search?.trim() || undefined,
      status: params.status && params.status !== "all"
        ? params.status.replace("-", "_")
        : undefined,
      priority:
        params.priority && params.priority !== "all"
          ? params.priority
          : undefined,
      category:
        params.category && params.category !== "all"
          ? params.category
          : undefined,
      assignee:
        params.assignee && params.assignee !== "all"
          ? params.assignee
          : undefined,
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

  return listItems(data, "agents", "eligible_agents").map((record) => {
    const name =
      nameFrom(record) ||
      text(firstValue(record, "email", "username"));
    if (!name) {
      throw new Error("The support agent response is missing a name.");
    }

    const roleValue = firstValue(record, "role", "role_name", "roles");
    const role = Array.isArray(roleValue)
      ? roleValue
          .map((item) =>
            typeof item === "string"
              ? item
              : nameFrom(item) || text(firstValue(asRecord(item), "key")),
          )
          .filter(Boolean)
          .join(", ")
      : text(roleValue);
    if (!role) {
      throw new Error(`The support agent ${name} is missing a role.`);
    }

    return {
      id: requiredText(record, "id", "agent_id", "agentId", "user_id", "userId"),
      name,
      role,
    };
  });
}

export async function getSupportTicket(ticketId: string) {
  const data = await apiGet(API_ROUTES.supportTicket(ticketId));
  const record = asRecord(data);
  const ticketRecord = ticketDetailRecord(data);
  const ticket = mapSupportTicket(ticketRecord);
  const userRecord =
    firstValue(record, "user", "requester") ??
    firstValue(ticketRecord, "user", "requester");
  const slaValue =
    firstValue(ticketRecord, "sla_minutes", "slaMinutes") ??
    firstValue(record, "sla_minutes", "slaMinutes");
  const slaMinutes = Number(slaValue);

  return {
    ticket,
    detail: {
      ticketId: ticket.id,
      user: mapTicketUser(userRecord, ticket.requester),
      rideId:
        text(
          firstValue(record, "ride_id", "rideId") ??
            firstValue(ticketRecord, "ride_id", "rideId"),
        ) || undefined,
      slaMinutes:
        Number.isFinite(slaMinutes) && slaValue !== undefined
          ? slaMinutes
          : undefined,
      messages: [],
      history: mapHistory(
        firstValue(record, "history", "activity", "events") ??
          firstValue(ticketRecord, "history", "activity", "events"),
      ),
    } satisfies SupportTicketDetail,
  };
}

export async function listSupportTicketMessages(ticketId: string) {
  const data = await apiGet(API_ROUTES.supportTicketMessages(ticketId));
  const record = asRecord(data);
  const messages = listItems(data, "messages");
  const notes = objectArray(firstValue(record, "internal_notes", "notes")).map(
    (note) => ({ ...note, is_internal: true }),
  );
  return [...messages, ...notes]
    .map(mapSupportTicketMessage)
    .sort((first, second) => first.createdAt.localeCompare(second.createdAt));
}

export async function getSupportTicketDetail(ticketId: string) {
  const [ticketData, messages] = await Promise.all([
    getSupportTicket(ticketId),
    listSupportTicketMessages(ticketId),
  ]);
  const embeddedMessages = ticketData.detail.messages;

  return {
    ...ticketData,
    detail: {
      ...ticketData.detail,
      messages: messages.length ? messages : embeddedMessages,
    },
  };
}

export async function createSupportTicket(input: CreateSupportTicketInput) {
  const data = await apiPost(API_ROUTES.supportTickets, {
    requester_id: input.requesterId.trim(),
    requester_type: input.requesterType.toLowerCase(),
    subject: input.subject.trim(),
    category: input.category,
    priority: input.priority,
    message: input.message.trim(),
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
    body: input.body.trim(),
    is_internal: input.internal,
  });
}

export async function assignSupportTicket(
  ticketId: string,
  agentId: string,
) {
  return apiPatch(API_ROUTES.supportTicketAssignment(ticketId), {
    assignee_id: agentId,
  });
}

export async function claimSupportTicket(ticketId: string) {
  return apiPost(API_ROUTES.supportTicketAssignToMe(ticketId));
}

export async function updateSupportTicketStatus(
  ticketId: string,
  status: SupportTicketStatus,
) {
  return apiPatch(API_ROUTES.supportTicketStatus(ticketId), {
    status: status.replace("-", "_"),
  });
}

export async function updateSupportTicketPriority(
  ticketId: string,
  priority: SupportTicketPriority,
) {
  return apiPatch(API_ROUTES.supportTicketPriority(ticketId), { priority });
}

export async function escalateSupportTicket(ticketId: string) {
  return apiPost(API_ROUTES.supportTicketEscalate(ticketId));
}
