"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import GateLoader from "./GateLoader";
import { useAuthHydrated, useSession } from "../hooks/useSession";
import { ROLE_REVALIDATE_MS } from "../lib/config";
import { firstRole, formatRole, isAdminRole } from "../lib/roles";
import { fetchCurrentUser, signOut } from "../services/auth";
import { updateSession } from "../services/tokenStore";

let verification = null;

// One request at a time, shared by every mount that needs the role.
const verifyRole = () => {
  if (!verification) {
    verification = fetchCurrentUser().finally(() => {
      verification = null;
    });
  }

  return verification;
};

const isRoleFresh = (session) =>
  Boolean(session?.roleVerifiedAt) &&
  Date.now() - session.roleVerifiedAt < ROLE_REVALIDATE_MS;

function RequireAdmin({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useSession();
  const hydrated = useAuthHydrated();
  const [check, setCheck] = useState("idle");

  const roleIsFresh = isRoleFresh(session);

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

        // The session is gone, so start over from the login page.
        if (error?.status === 401) {
          signOut();
          setCheck("signed-out");
          return;
        }

        // The server could not be reached. Keep the role we already trust rather
        // than locking a signed in admin out over a dropped connection.
        setCheck("failed");
      });

    return () => {
      active = false;
    };
  }, [hydrated, session, roleIsFresh]);

  const verified = roleIsFresh || check === "passed" || check === "failed";
  const needsSignIn = hydrated && (!session || check === "signed-out");
  const needsAdmin =
    hydrated && Boolean(session) && verified && !isAdminRole(session.role);

  useEffect(() => {
    if (needsSignIn) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
      return;
    }

    if (needsAdmin) {
      router.replace(`/request-admin?from=${encodeURIComponent(pathname)}`);
    }
  }, [needsSignIn, needsAdmin, pathname, router]);

  if (!hydrated || needsSignIn || needsAdmin) return <GateLoader />;

  if (!verified) return <GateLoader />;

  return children;
}

export default RequireAdmin;
