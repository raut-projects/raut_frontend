export type RbacPermissionScope = "platform" | "region" | "assigned" | "own";

export type RbacGrant = {
  scope: RbacPermissionScope | string;
  scopeId: string | null;
  requiredScopes: string[];
  assignmentId: string | null;
  constraints: Record<string, unknown>;
};

export type RbacRoleAssignment = {
  assignmentId: string | null;
  key: string;
  scope: RbacPermissionScope | string;
  scopeId: string | null;
  expiresAt: string | null;
};

export type RbacAccessSnapshot = {
  permissions: string[];
  roles: RbacRoleAssignment[];
  verifiedAt: number;
};
