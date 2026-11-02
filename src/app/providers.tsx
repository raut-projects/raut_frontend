"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/components/toastProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "@/lib/queryClient";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(queryClient);

  return (
    <QueryClientProvider client={client}>
      <TooltipProvider>
        <ToastProvider>{children}</ToastProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
