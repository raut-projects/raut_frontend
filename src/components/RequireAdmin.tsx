"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import AccessDenied from "./AccessDenied";
import GateLoader from "./GateLoader";
import { useAuthHydrated, useSession } from "../hooks/useSession";
import {
  firstPermittedRoute,
  resolveRoutePermission,
} from "../lib/navigation";
import { hasDashboardAccess, hasPermission } from "../lib/permissions";
import { usePermissionStore } from "../store/permissionStore";

function RequireAdmin({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useSession();
  const hydrated = useAuthHydrated();
  const permissionAccess = usePermissionStore((state) => state.access);
  const permissionHydrated = usePermissionStore((state) => state.hydrated);

  const accessAvailable = hasDashboardAccess(permissionAccess);
  const requiredPermission = resolveRoutePermission(pathname);
  const permitted =
    accessAvailable &&
    (!requiredPermission || hasPermission(permissionAccess, requiredPermission));
  const fallback =
    pathname === "/" && !permitted
      ? firstPermittedRoute(permissionAccess)
      : null;

  const needsSignIn = hydrated && !session;
  const denied =
    hydrated &&
    Boolean(session) &&
    permissionHydrated &&
    (!accessAvailable || (!permitted && !fallback));

  useEffect(() => {
    if (needsSignIn) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
      return;
    }

    if (fallback) {
      router.replace(fallback);
    }
  }, [needsSignIn, fallback, pathname, router]);

  if (!hydrated || !permissionHydrated || !session || needsSignIn) {
    return <GateLoader />;
  }

  if (fallback) return <GateLoader />;
  if (denied) return <AccessDenied />;

  return children;
}

export default RequireAdmin;
