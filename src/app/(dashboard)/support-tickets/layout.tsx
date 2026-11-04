"use client";

import { SupportTicketsProvider } from "@/components/supportTicketsContext";

export default function SupportTicketsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SupportTicketsProvider>{children}</SupportTicketsProvider>;
}
