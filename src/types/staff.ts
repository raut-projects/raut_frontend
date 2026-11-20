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

export type StaffInvitationStatus =
  | "pending"
  | "accepted"
  | "cancelled"
  | "expired";

export type StaffInvitation = {
  id: string;
  email: string;
  fullName: string;
  roleId: string;
  roleKey: string;
  roleName: string;
  scopeType: StaffScopeType | string;
  scopeId: string | null;
  status: StaffInvitationStatus;
  invitationExpiresAt: string | null;
  assignmentExpiresAt: string | null;
  acceptedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  deliveryStatus: string;
  lastDeliveryAt: string | null;
  invitedBy: string;
  createdAt: string | null;
};

export type StaffInvitationListParams = {
  status?: StaffInvitationStatus | "all";
  page?: number;
  pageSize?: number;
};

export type StaffInvitationListResult = {
  items: StaffInvitation[];
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

export type StaffInvitationVerification = {
  email: string;
  fullName: string;
  roleName: string;
  scopeType: StaffScopeType | string;
  scopeId: string | null;
  invitationExpiresAt: string | null;
  requiresPasswordSetup: boolean;
  requiresPhoneSetup: boolean;
  requiresCurrentPassword: boolean;
};

export type AcceptStaffInvitationPayload = {
  token: string;
  phone?: string | null;
  current_password?: string | null;
  change_password?: boolean;
  password?: string | null;
  password_confirmation?: string | null;
};

export type AcceptStaffInvitationResult = {
  redirectUrl: string | null;
  message: string;
};
