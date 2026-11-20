import { API_ROUTES } from "@/lib/config";
import type {
  StaffAssignRolePayload,
  StaffInvitation,
  StaffInvitationListParams,
  StaffInvitationListResult,
  StaffInvitationStatus,
  StaffInvitePayload,
  StaffListParams,
  StaffListResult,
  StaffMember,
} from "@/types/staff";
import { apiDelete, apiGet, apiPost } from "./api";
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

const INVITATION_STATUSES: StaffInvitationStatus[] = [
  "pending",
  "accepted",
  "cancelled",
  "expired",
];

const normalizeInvitationStatus = (
  record: RecordValue,
): StaffInvitationStatus => {
  const raw = String(
    firstValue(record, "status", "invitation_status") ?? "",
  )
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
    fullName: String(
      firstValue(item, "full_name", "fullName", "name") ?? "",
    ),
    roleId: String(firstValue(item, "role_id", "roleId") ?? ""),
    roleKey: String(firstValue(item, "role_key", "roleKey") ?? ""),
    roleName: String(firstValue(item, "role_name", "roleName") ?? ""),
    scopeType: String(firstValue(item, "scope_type", "scopeType") ?? "platform"),
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
): Promise<StaffListResult> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const data = await apiGet(API_ROUTES.staff, {
    params: { page, page_size: pageSize },
  });
  const record = asRecord(data);
  const rawItems = Array.isArray(data)
    ? data
    : firstValue(record, "items", "results", "staff");
  const items = (Array.isArray(rawItems) ? rawItems : [])
    .map(mapStaffMember)
    .filter((member): member is StaffMember => Boolean(member.id));
  const total = numberValue(
    firstValue(record, "total_items", "total", "total_count"),
    items.length,
  );
  const totalPages = numberValue(
    firstValue(record, "total_pages"),
    Math.max(1, Math.ceil(total / pageSize)),
  );
  const currentPage = numberValue(firstValue(record, "page"), page);
  const currentPageSize = numberValue(
    firstValue(record, "page_size"),
    pageSize,
  );
  const hasNextValue = firstValue(record, "has_next");
  const hasPrevValue = firstValue(record, "has_prev");

  return {
    items,
    total,
    page: currentPage,
    pageSize: currentPageSize,
    totalPages,
    hasNext:
      typeof hasNextValue === "boolean"
        ? hasNextValue
        : currentPage < totalPages,
    hasPrev:
      typeof hasPrevValue === "boolean" ? hasPrevValue : currentPage > 1,
  };
}

export async function listStaffInvitations(
  params: StaffInvitationListParams = {},
): Promise<StaffInvitationListResult> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const status = params.status && params.status !== "all" ? params.status : undefined;
  const data = await apiGet(API_ROUTES.staffInvitations, {
    params: { status, page, page_size: pageSize },
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
  const total = numberValue(
    firstValue(pagination, "total_items", "total", "total_count"),
    items.length,
  );
  const totalPages = numberValue(
    firstValue(pagination, "total_pages"),
    Math.max(1, Math.ceil(total / pageSize)),
  );
  const currentPage = numberValue(firstValue(pagination, "page"), page);
  const currentPageSize = numberValue(
    firstValue(pagination, "page_size"),
    pageSize,
  );
  const hasNextValue = firstValue(pagination, "has_next");
  const hasPrevValue = firstValue(pagination, "has_prev");

  return {
    items,
    total,
    page: currentPage,
    pageSize: currentPageSize,
    totalPages,
    hasNext:
      typeof hasNextValue === "boolean"
        ? hasNextValue
        : currentPage < totalPages,
    hasPrev:
      typeof hasPrevValue === "boolean" ? hasPrevValue : currentPage > 1,
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
