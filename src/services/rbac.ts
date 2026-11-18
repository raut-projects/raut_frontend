import { API_ROUTES } from "../lib/config";
import type {
  RbacAccessSnapshot,
  RbacCatalogPermission,
  RbacCatalogRole,
  RbacRolePayload,
} from "../types/rbac";
import { apiDelete, apiGet, apiPatch, apiPost } from "./api";
import { request } from "./http";
import {
  mapRbacAccess,
  mapRbacCatalogRole,
  mapRbacPermissionCatalog,
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

const roleFromMutation = (
  raw: unknown,
  fallback: RbacRolePayload,
): RbacCatalogRole => {
  const envelope = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const data = "data" in envelope ? envelope.data : envelope;
  const dataRecord = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const nested = dataRecord.role ?? dataRecord.rbac_role ?? data;
  const mapped = mapRbacCatalogRole(nested);

  if (mapped.key) return mapped;

  return mapRbacCatalogRole({
    key: fallback.key,
    name: fallback.name,
    description: fallback.description ?? "",
    permissions: fallback.permissions,
    is_system: false,
  });
};

export async function createRbacRole(
  payload: RbacRolePayload,
): Promise<RbacCatalogRole> {
  const raw = await apiPost(API_ROUTES.rbacRoles, payload);

  return roleFromMutation(raw, payload);
}

export async function updateRbacRole(
  roleKey: string,
  payload: RbacRolePayload,
): Promise<RbacCatalogRole> {
  const raw = await apiPatch(API_ROUTES.rbacRole(roleKey), payload);

  return roleFromMutation(raw, payload);
}

export async function deleteRbacRole(roleKey: string): Promise<void> {
  await apiDelete(API_ROUTES.rbacRole(roleKey));
}
