"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/components/toastProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "@/lib/queryClient";
import { useSessionExpiry } from "@/hooks/useSessionExpiry";
import { useAuthStore } from "@/store/authStore";
import { hydratePermissions } from "@/store/permissionStore";

const ReactQueryDevtools = dynamic(
  () =>
    import("@tanstack/react-query-devtools").then(
      (module) => module.ReactQueryDevtools,
    ),
  { ssr: false },
);

export default function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(queryClient);
  const hydrateAuth = useAuthStore((state) => state.hydrate);

  useSessionExpiry();

  useEffect(() => {
    hydrateAuth();
    void hydratePermissions();

    return useAuthStore.subscribe((state, previous) => {
      if (previous.session && !state.session) client.clear();
    });
  }, [client, hydrateAuth]);

  return (
    <QueryClientProvider client={ client }>
      <TooltipProvider>
        <ToastProvider>{ children }</ToastProvider>
      </TooltipProvider>
      {process.env.NODE_ENV === "development" ? (
        <ReactQueryDevtools initialIsOpen={false} />
      ) : null}
    </QueryClientProvider>
  );
}
