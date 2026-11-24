export type RbacPermissionScope = "platform" | "region" | "assigned" | "own";

export type RbacAccessGrant = {
  code: string;
  scope: RbacPermissionScope | string;
  scopeId: string | null;
  requiredScopes: string[];
  assignmentId: string | null;
  constraints: Record<string, unknown>;
};

export type RbacGrant = RbacAccessGrant;

export type RbacRoleAssignment = {
  assignmentId: string | null;
  key: string;
  scope: RbacPermissionScope | string;
  scopeId: string | null;
  expiresAt: string | null;
};

export type RbacAccessSnapshot = {
  permissions: string[];
  grantsByCode: Record<string, RbacAccessGrant[]>;
  roles: RbacRoleAssignment[];
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

export type RbacRoleCreatePayload = {
  key: string;
  name: string;
  description?: string;
  permissions: RbacRolePermission[];
};

export type RbacRoleUpdatePayload = {
  name: string;
  description?: string;
  permissions: RbacRolePermission[];
};

export type RbacRegion = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: string | null;
};

export type RbacRegionPayload = {
  code: string;
  name: string;
};
