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

export type RbacCatalogPermission = {
  code: string;
  name: string;
  description: string;
  module: string;
  createdAt: string | null;
};

export type RbacRolePermission = {
  code: string;
  scope: string;
  constraints: Record<string, unknown>;
};

export type RbacCatalogRole = {
  id: string | null;
  key: string;
  name: string;
  description: string;
  isSystem: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  permissions: RbacRolePermission[];
};
