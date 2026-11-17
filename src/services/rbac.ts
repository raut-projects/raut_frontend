import { API_ROUTES } from "../lib/config";
import type { RbacAccessSnapshot } from "../types/rbac";
import { request } from "./http";
import { mapRbacAccess } from "./mappers";

export async function fetchMyPermissions(): Promise<RbacAccessSnapshot> {
  const payload = await request(API_ROUTES.myPermissions, { auth: true });

  return mapRbacAccess(payload);
}
