"use client";

import RequireAdmin from "@/components/RequireAdmin";
import Header from "@/components/Header";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAdmin>
      <SidebarProvider className="bg-slate-50 print:bg-white">
        <AppSidebar />
        <SidebarInset className="min-w-0 bg-slate-50 print:bg-white">
          <Header />
          <div className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8 print:p-0">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </RequireAdmin>
  );
}
