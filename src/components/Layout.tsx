"use client";

import Header from "./Header";
import { AppSidebar } from "./app-sidebar";
import { SidebarInset, SidebarProvider } from "./ui/sidebar";

function Layout({ children }) {
  return (
    <SidebarProvider className="bg-slate-50 print:bg-white">
      <AppSidebar />
      <SidebarInset className="min-w-0 bg-slate-50 print:bg-white">
        <Header />
        <div className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8 print:p-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default Layout;
