"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import GateLoader from "./GateLoader";
import { useSession } from "../hooks/useSession";

function RequireAuth({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useSession();

  useEffect(() => {
    if (!session) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
    }
  }, [session, pathname, router]);

  if (!session) return <GateLoader />;

  return children;
}

export default RequireAuth;
