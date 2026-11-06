"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import GateLoader from "./GateLoader";
import { useAuthHydrated, useSession } from "../hooks/useSession";

function RequireAuth({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useSession();
  const hydrated = useAuthHydrated();

  useEffect(() => {
    if (hydrated && !session) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
    }
  }, [hydrated, session, pathname, router]);

  if (!hydrated || !session) return <GateLoader />;

  return children;
}

export default RequireAuth;
