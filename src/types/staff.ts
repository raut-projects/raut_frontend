export type StaffStatus = "active" | "invited" | "deactivated";

export type StaffScopeType = "platform" | "region" | "assigned" | "own";

export type StaffAssignment = {
  assignmentId: string;
  roleId: string;
  roleKey: string;
  roleName: string;
  scope: string;
  scopeId: string | null;
  expiresAt: string | null;
  assignedAt: string | null;
};

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  status: StaffStatus;
  assignments: StaffAssignment[];
};

export type StaffListParams = {
  page?: number;
  pageSize?: number;
};

export type StaffListResult = {
  items: StaffMember[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type StaffAssignRolePayload = {
  role_id: string;
  scope_type: StaffScopeType;
  scope_id: string | null;
  expires_at: string | null;
  reason?: string;
};

export type StaffInvitePayload = {
  email: string;
  full_name: string;
  role_id: string;
  scope_type: StaffScopeType;
  scope_id?: string | null;
  assignment_expires_at?: string;
};

export type StaffRevokeRolePayload = {
  reason: string;
};

export type StaffDeactivatePayload = {
  reason: string;
};
