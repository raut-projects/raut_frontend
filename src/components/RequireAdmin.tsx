"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import AccessDenied from "./AccessDenied";
import GateLoader from "./GateLoader";
import { useAuthHydrated, useSession } from "../hooks/useSession";
import {
  RBAC_REVALIDATE_MS,
  RBAC_STALE_GRACE_MS,
  ROLE_REVALIDATE_MS,
} from "../lib/config";
import {
  firstPermittedRoute,
  resolveRoutePermission,
} from "../lib/navigation";
import { hasPermission } from "../lib/permissions";
import { firstRole, formatRole } from "../lib/roles";
import { fetchCurrentUser, signOut } from "../services/auth";
import { fetchMyPermissions } from "../services/rbac";
import { updateSession } from "../services/tokenStore";

let verification = null;
let accessVerification = null;

const verifyRole = () => {
  if (!verification) {
    verification = fetchCurrentUser().finally(() => {
      verification = null;
    });
  }

  return verification;
};

const verifyAccess = () => {
  if (!accessVerification) {
    accessVerification = fetchMyPermissions().finally(() => {
      accessVerification = null;
    });
  }

  return accessVerification;
};

const isRoleFresh = (session) =>
  Boolean(session?.roleVerifiedAt) &&
  Date.now() - session.roleVerifiedAt < ROLE_REVALIDATE_MS;

const isAccessFresh = (session) =>
  Boolean(session?.access?.verifiedAt) &&
  Date.now() - session.access.verifiedAt < RBAC_REVALIDATE_MS;

const isAccessRecent = (session) =>
  Boolean(session?.access?.verifiedAt) &&
  Date.now() - session.access.verifiedAt < RBAC_STALE_GRACE_MS;

function RequireAdmin({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useSession();
  const hydrated = useAuthHydrated();
  const [check, setCheck] = useState("idle");
  const [accessCheck, setAccessCheck] = useState("idle");

  const roleIsFresh = isRoleFresh(session);
  const accessFresh = isAccessFresh(session);

  useEffect(() => {
    if (!hydrated || !session || roleIsFresh) return undefined;

    let active = true;

    verifyRole()
      .then(({ role }) => {
        if (!active) return;

        const nextRole = firstRole(role, session.role) ?? "user";

        updateSession({
          role: nextRole,
          roleLabel: formatRole(nextRole),
          roleVerifiedAt: Date.now(),
        });

        setCheck("passed");
      })
      .catch((error) => {
        if (!active) return;

        if (error?.status === 401) {
          signOut();
          setCheck("signed-out");
          return;
        }

        setCheck("failed");
      });

    return () => {
      active = false;
    };
  }, [hydrated, session, roleIsFresh]);

  useEffect(() => {
    if (!hydrated || !session || accessFresh) return undefined;

    let active = true;

    verifyAccess()
      .then((access) => {
        if (!active) return;

        updateSession({ access });
        setAccessCheck("ready");
      })
      .catch((error) => {
        if (!active) return;

        if (error?.status === 401) {
          signOut();
          setAccessCheck("signed-out");
          return;
        }

        setAccessCheck("failed");
      });

    return () => {
      active = false;
    };
  }, [hydrated, session, accessFresh]);

  const verified = roleIsFresh || check === "passed" || check === "failed";
  const accessReady =
    accessFresh ||
    accessCheck === "ready" ||
    accessCheck === "failed";

  const requiredPermission = resolveRoutePermission(pathname);
  const permitted =
    !requiredPermission || hasPermission(session?.access, requiredPermission);
  const fallback =
    pathname === "/" && !permitted
      ? firstPermittedRoute(session?.access)
      : null;

  const needsSignIn =
    hydrated && (!session || check === "signed-out" || accessCheck === "signed-out");
  const denied =
    hydrated &&
    Boolean(session) &&
    verified &&
    ((accessCheck === "failed" && !isAccessRecent(session)) ||
      (!permitted && !fallback));

  useEffect(() => {
    if (needsSignIn) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
      return;
    }

    if (fallback) {
      router.replace(fallback);
    }
  }, [needsSignIn, fallback, pathname, router]);

  if (!hydrated || needsSignIn || !verified) return <GateLoader />;
  if (!accessReady || fallback) return <GateLoader />;
  if (denied) return <AccessDenied />;

  return children;
}

export default RequireAdmin;
