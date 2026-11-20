import { API_ROUTES } from "@/lib/config";
import type {
  StaffAssignRolePayload,
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

export async function inviteStaff(payload: StaffInvitePayload): Promise<void> {
  await apiPost(API_ROUTES.staffInvitations, payload);
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
