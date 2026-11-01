"use client";

import { useState } from "react";
import Sidebar from "./sidebar";
import Header from "./Header";
import {
  setSidebarCollapsed,
  useSidebarCollapsed,
} from "../lib/sidebarPreference";

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarCollapsed = useSidebarCollapsed();

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export default Layout;
