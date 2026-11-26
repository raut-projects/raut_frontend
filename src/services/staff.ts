import { API_ROUTES } from "@/lib/config";
import type {
  AcceptStaffInvitationPayload,
  AcceptStaffInvitationResult,
  StaffAssignRolePayload,
  StaffInvitation,
  StaffInvitationListParams,
  StaffInvitationListResult,
  StaffInvitationStatus,
  StaffInvitationVerification,
  StaffInvitePayload,
  StaffListParams,
  StaffListResult,
  StaffMember,
} from "@/types/staff";
import { apiDelete, apiGet, apiPost } from "./api";
import { envelopeData, envelopeMessage, request } from "./http";
import { mapStaffMember } from "./mappers";

type RecordValue = Record<string, unknown>;

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

const numberValue = (value: unknown, fallback: number) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const nullableString = (value: unknown) =>
  value === undefined || value === null || value === "" ? null : String(value);

const textValue = (value: unknown) =>
  value === undefined || value === null ? "" : String(value).trim();

const booleanValue = (value: unknown) =>
  value === true || value === 1 || value === "true" || value === "1";

const INVITATION_STATUSES: StaffInvitationStatus[] = [
  "pending",
  "accepted",
  "cancelled",
  "expired",
];

const normalizeInvitationStatus = (
  record: RecordValue,
): StaffInvitationStatus => {
  const raw = String(firstValue(record, "status", "invitation_status") ?? "")
    .trim()
    .toLowerCase();

  if (INVITATION_STATUSES.includes(raw as StaffInvitationStatus)) {
    return raw as StaffInvitationStatus;
  }

  if (firstValue(record, "accepted_at", "acceptedAt")) return "accepted";
  if (firstValue(record, "cancelled_at", "cancelledAt")) return "cancelled";

  const expiresAt = firstValue(
    record,
    "invitation_expires_at",
    "invitationExpiresAt",
  );

  if (expiresAt && new Date(String(expiresAt)).getTime() < Date.now()) {
    return "expired";
  }

  return "pending";
};

const mapStaffInvitation = (raw: unknown): StaffInvitation | null => {
  const source = asRecord(raw);
  const nested = asRecord(firstValue(source, "invitation", "staff_invitation"));
  const item = Object.keys(nested).length ? nested : source;
  const id = String(firstValue(item, "id", "invitation_id") ?? "");

  if (!id) return null;

  return {
    id,
    email: String(firstValue(item, "email") ?? ""),
    fullName: String(firstValue(item, "full_name", "fullName", "name") ?? ""),
    roleId: String(firstValue(item, "role_id", "roleId") ?? ""),
    roleKey: String(firstValue(item, "role_key", "roleKey") ?? ""),
    roleName: String(firstValue(item, "role_name", "roleName") ?? ""),
    scopeType: String(
      firstValue(item, "scope_type", "scopeType") ?? "platform",
    ),
    scopeId: nullableString(firstValue(item, "scope_id", "scopeId")),
    status: normalizeInvitationStatus(item),
    invitationExpiresAt: nullableString(
      firstValue(item, "invitation_expires_at", "invitationExpiresAt"),
    ),
    assignmentExpiresAt: nullableString(
      firstValue(item, "assignment_expires_at", "assignmentExpiresAt"),
    ),
    acceptedAt: nullableString(firstValue(item, "accepted_at", "acceptedAt")),
    cancelledAt: nullableString(
      firstValue(item, "cancelled_at", "cancelledAt"),
    ),
    cancellationReason: nullableString(
      firstValue(item, "cancellation_reason", "cancellationReason"),
    ),
    deliveryStatus: String(
      firstValue(item, "delivery_status", "deliveryStatus") ?? "",
    ),
    lastDeliveryAt: nullableString(
      firstValue(item, "last_delivery_at", "lastDeliveryAt"),
    ),
    invitedBy: String(firstValue(item, "invited_by", "invitedBy") ?? ""),
    createdAt: nullableString(firstValue(item, "created_at", "createdAt")),
  };
};

export async function listStaff(
  params: StaffListParams = {},
  { signal }: { signal?: AbortSignal } = {},
): Promise<StaffListResult> {
  const page = Math.max(1, Math.trunc(params.page ?? 1));
  const pageSize = Math.max(1, Math.trunc(params.pageSize ?? 20));
  const data = await apiGet(API_ROUTES.staff, {
    params: { page, page_size: pageSize },
    signal,
  });
  const record = asRecord(data);
  const rawItems = Array.isArray(data)
    ? data
    : firstValue(record, "items", "results", "staff");
  const items = (Array.isArray(rawItems) ? rawItems : [])
    .map(mapStaffMember)
    .filter((member): member is StaffMember => Boolean(member.id));
  const total = Math.max(
    0,
    numberValue(
      firstValue(record, "total_items", "total", "total_count"),
      items.length,
    ),
  );
  const totalPages = Math.max(
    1,
    Math.trunc(
      numberValue(
        firstValue(record, "total_pages"),
        Math.max(1, Math.ceil(total / pageSize)),
      ),
    ),
  );
  const currentPage = Math.min(
    totalPages,
    Math.max(1, Math.trunc(numberValue(firstValue(record, "page"), page))),
  );
  const currentPageSize = Math.max(
    1,
    Math.trunc(numberValue(firstValue(record, "page_size"), pageSize)),
  );

  return {
    items,
    total,
    page: currentPage,
    pageSize: currentPageSize,
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
}

export async function listStaffInvitations(
  params: StaffInvitationListParams = {},
  { signal }: { signal?: AbortSignal } = {},
): Promise<StaffInvitationListResult> {
  const page = Math.max(1, Math.trunc(params.page ?? 1));
  const pageSize = Math.max(1, Math.trunc(params.pageSize ?? 20));
  const status =
    params.status && params.status !== "all" ? params.status : undefined;
  const data = await apiGet(API_ROUTES.staffInvitations, {
    params: { status, page, page_size: pageSize },
    signal,
  });
  const record = asRecord(data);
  const pagination = {
    ...record,
    ...asRecord(firstValue(record, "pagination", "meta")),
  };
  const rawItems = Array.isArray(data)
    ? data
    : firstValue(record, "items", "results", "invitations");
  const items = (Array.isArray(rawItems) ? rawItems : [])
    .map(mapStaffInvitation)
    .filter((invitation): invitation is StaffInvitation => Boolean(invitation));
  const total = Math.max(
    0,
    numberValue(
      firstValue(pagination, "total_items", "total", "total_count"),
      items.length,
    ),
  );
  const totalPages = Math.max(
    1,
    Math.trunc(
      numberValue(
        firstValue(pagination, "total_pages"),
        Math.max(1, Math.ceil(total / pageSize)),
      ),
    ),
  );
  const currentPage = Math.min(
    totalPages,
    Math.max(1, Math.trunc(numberValue(firstValue(pagination, "page"), page))),
  );
  const currentPageSize = Math.max(
    1,
    Math.trunc(numberValue(firstValue(pagination, "page_size"), pageSize)),
  );

  return {
    items,
    total,
    page: currentPage,
    pageSize: currentPageSize,
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
}

export async function inviteStaff(payload: StaffInvitePayload): Promise<void> {
  await apiPost(API_ROUTES.staffInvitations, payload);
}

export async function cancelStaffInvitation(
  invitationId: string,
  reason: string,
): Promise<void> {
  await apiPost(API_ROUTES.staffInvitationCancel(invitationId), { reason });
}

export async function resendStaffInvitation(
  invitationId: string,
): Promise<void> {
  await apiPost(API_ROUTES.staffInvitationResend(invitationId));
}

export async function assignStaffRole(
  userId: string,
  payload: StaffAssignRolePayload,
): Promise<void> {
  await apiPost(API_ROUTES.staffRoles(userId), payload);
}

export async function revokeStaffRole(
  userId: string,
  assignmentId: string,
  reason: string,
): Promise<void> {
  await apiDelete(API_ROUTES.staffRole(userId, assignmentId), {
    body: { reason },
  });
}

export async function deactivateStaff(
  userId: string,
  reason: string,
): Promise<void> {
  await apiPost(API_ROUTES.staffDeactivate(userId), { reason });
}

const pickRedirectUrl = (...sources: unknown[]) => {
  for (const source of sources) {
    const record = asRecord(source);
    const nested = asRecord(firstValue(record, "data"));
    const candidates = [
      firstValue(
        record,
        "redirect_url",
        "redirectUrl",
        "dashboard_url",
        "dashboardUrl",
        "url",
        "redirect",
      ),
      firstValue(
        nested,
        "redirect_url",
        "redirectUrl",
        "dashboard_url",
        "dashboardUrl",
        "url",
        "redirect",
      ),
    ];

    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim();
      }
    }
  }

  return null;
};

/**
 * Verifies an emailed invitation token without an admin session. The response
 * carries no published schema, so field aliases and boolean spellings are
 * normalised here rather than in the page.
 */
export async function verifyStaffInvitation(
  token: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<StaffInvitationVerification> {
  const payload = await request(API_ROUTES.staffInvitationVerify, {
    method: "POST",
    body: { token },
    auth: false,
    signal,
  });
  const data = asRecord(envelopeData(payload) ?? payload);
  const raw = asRecord(
    firstValue(data, "invitation", "staff_invitation") ?? data,
  );

  return {
    email: textValue(firstValue(raw, "email")),
    fullName: textValue(firstValue(raw, "full_name", "fullName", "name")),
    roleName: textValue(firstValue(raw, "role_name", "roleName", "role")),
    scopeType:
      textValue(firstValue(raw, "scope_type", "scopeType")) || "platform",
    scopeId: nullableString(firstValue(raw, "scope_id", "scopeId")),
    invitationExpiresAt: nullableString(
      firstValue(
        raw,
        "invitation_expires_at",
        "invitationExpiresAt",
        "expires_at",
      ),
    ),
    requiresPasswordSetup: booleanValue(
      firstValue(raw, "requires_password_setup", "requiresPasswordSetup"),
    ),
    requiresPhoneSetup: booleanValue(
      firstValue(raw, "requires_phone_setup", "requiresPhoneSetup"),
    ),
    requiresCurrentPassword: booleanValue(
      firstValue(raw, "requires_current_password", "requiresCurrentPassword"),
    ),
  };
}

/**
 * Accepts an emailed invitation. Only fields the invite requires are sent;
 * the backend creates or matches the account and assigns the invited role.
 */
export async function acceptStaffInvitation(
  input: AcceptStaffInvitationPayload,
): Promise<AcceptStaffInvitationResult> {
  const body: Record<string, string | boolean | null | undefined> = {
    token: input.token.trim(),
    change_password: Boolean(input.change_password),
  };

  if (input.current_password !== undefined) {
    body.current_password = input.current_password;
  }
  if (input.phone !== undefined) body.phone = input.phone;
  if (input.password !== undefined) body.password = input.password;
  if (input.password_confirmation !== undefined) {
    body.password_confirmation = input.password_confirmation;
  }

  const payload = await request(API_ROUTES.staffInvitationAccept, {
    method: "POST",
    body,
    auth: false,
  });
  const data = envelopeData(payload) ?? payload;

  return {
    redirectUrl: pickRedirectUrl(payload, data),
    message: envelopeMessage(payload) || "Invitation accepted.",
  };
}
