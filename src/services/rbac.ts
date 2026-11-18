import { API_ROUTES } from "../lib/config";
import type {
  RbacAccessSnapshot,
  RbacCatalogPermission,
  RbacCatalogRole,
} from "../types/rbac";
import { apiGet } from "./api";
import { request } from "./http";
import {
  mapRbacAccess,
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
