import { API_ROUTES } from "../lib/config";
import type {
  RbacAccessSnapshot,
  RbacCatalogPermission,
  RbacCatalogRole,
  RbacRegion,
  RbacRegionPayload,
  RbacRoleCreatePayload,
  RbacRolePermission,
  RbacRoleUpdatePayload,
} from "../types/rbac";
import { apiDelete, apiGet, apiPatch, apiPost } from "./api";
import { request } from "./http";
import {
  mapRbacAccess,
  mapRbacCatalogRole,
  mapRbacPermissionCatalog,
  mapRbacRegion,
  mapRbacRegionCatalog,
  mapRbacRoleCatalog,
} from "./mappers";

export async function fetchMyPermissions(): Promise<RbacAccessSnapshot> {
  const payload = await request(API_ROUTES.myPermissions, { auth: true });

  return mapRbacAccess(payload);
}

export async function fetchPermissionCatalog(): Promise<
  RbacCatalogPermission[]
> {
  const payload = await apiGet(API_ROUTES.rbacPermissions);

  return mapRbacPermissionCatalog(payload);
}

export async function fetchRbacRoles(): Promise<RbacCatalogRole[]> {
  const payload = await apiGet(API_ROUTES.rbacRoles);

  return mapRbacRoleCatalog(payload);
}

type RoleMutationFallback = {
  key?: string;
  name: string;
  description?: string;
  permissions: RbacRolePermission[];
};

const roleFromMutation = (
  raw: unknown,
  fallback: RoleMutationFallback,
): RbacCatalogRole => {
  const envelope = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const data = "data" in envelope ? envelope.data : envelope;
  const dataRecord = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const nested = dataRecord.role ?? dataRecord.rbac_role ?? data;
  const mapped = mapRbacCatalogRole(nested);

  if (mapped.key) return mapped;

  return mapRbacCatalogRole({
    key: fallback.key ?? "",
    name: fallback.name,
    description: fallback.description ?? "",
    permissions: fallback.permissions,
    is_system: false,
  });
};

export async function createRbacRole(
  payload: RbacRoleCreatePayload,
): Promise<RbacCatalogRole> {
  const raw = await apiPost(API_ROUTES.rbacRoles, payload);

  return roleFromMutation(raw, payload);
}

export async function updateRbacRole(
  roleId: string,
  payload: RbacRoleUpdatePayload,
  roleKey?: string,
): Promise<RbacCatalogRole> {
  const raw = await apiPatch(API_ROUTES.rbacRole(roleId), payload);

  return roleFromMutation(raw, { ...payload, key: roleKey });
}

export async function deleteRbacRole(roleId: string): Promise<void> {
  await apiDelete(API_ROUTES.rbacRole(roleId));
}

export async function fetchRbacRegions(): Promise<RbacRegion[]> {
  const payload = await apiGet(API_ROUTES.rbacRegions);

  return mapRbacRegionCatalog(payload);
}

export async function createRbacRegion(
  payload: RbacRegionPayload,
): Promise<RbacRegion> {
  const raw = await apiPost(API_ROUTES.rbacRegions, payload);

  return mapRbacRegion(raw);
}
