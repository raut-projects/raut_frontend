"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, KeyRound, LogOut } from "lucide-react";
import NotificationPanel from "./NotificationPanel";
import UpdatePasswordDialog from "./UpdatePasswordDialog";
import { SidebarTrigger } from "./ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useIsClient } from "../lib/useIsClient";
import { useSession } from "../hooks/useSession";
import {
  useMarkNotificationRead,
  useNotifications,
} from "../hooks/useNotifications";
import { signOut } from "../services/auth";

const titles = {
  "/": "Dashboard",
  "/customers": "Customers",
  "/live-rides": "Live Rides",
  "/drivers": "Drivers",
  "/rides": "Rides",
  "/routes": "Routes",
  "/payouts": "Payouts",
  "/transactions": "Transactions",
  "/marketing": "Promotions",
  "/marketing/referrals": "Referrals",
  "/support-tickets": "Support Tickets",
  "/analytics": "Analytics",
  "/settings": "Settings",
  "/settings/platform": "Platform Config",
  "/settings/staffs": "Staff & Roles",
  "/settings/staffs/permissions": "Permissions",
  "/settings/staffs/roles": "Roles",
  "/settings/audit-logs": "Audit Logs",
  "/settings/system-health": "System Health",
  "/settings/system-health/jobs": "Background Jobs",
  "/settings/system-health/incidents": "Recent Incidents",
};

function resolveTitle(pathname: string) {
  if (titles[pathname]) return titles[pathname];
  if (pathname.startsWith("/marketing/promotions")) return "Promotions";
  if (pathname.startsWith("/marketing/referrals")) return "Referrals";

  return "Raut";
}

function Header() {
  const pathname = usePathname().replace(/\/+$/, "") || "/";
  const title = resolveTitle(pathname);
  const router = useRouter();

  const mounted = useIsClient();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [updatePasswordOpen, setUpdatePasswordOpen] = useState(false);
  const [dismissed, setDismissed] = useState([]);

  const session = useSession();
  const displayName = session?.name ?? "User";
  const displayRole = session?.roleLabel ?? session?.role ?? "User";
  const { data: fetchedNotifications } = useNotifications();
  const markRead = useMarkNotificationRead();

  const notifications = useMemo(
    () =>
      (fetchedNotifications ?? []).filter(
        (notification) => !dismissed.includes(notification.id),
      ),
    [fetchedNotifications, dismissed],
  );

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  const handleMarkRead = (id) => {
    markRead.mutate(id);
  };

  const handleMarkAllRead = () => {
    notifications
      .filter((notification) => !notification.read)
      .forEach((notification) => markRead.mutate(notification.id));
  };

  const handleDismiss = (id) =>
    setDismissed((prev) => (prev.includes(id) ? prev : [...prev, id]));

  const handleSignOut = () => {
    signOut();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-xl print:hidden sm:px-6">
      <SidebarTrigger className="-ml-1 text-slate-500" />

      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold tracking-tight text-slate-900">
          { title }
        </h1>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <div className="relative hidden md:block">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="search"
            placeholder="Search..."
            aria-label="Search"
            className="w-64 rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 transition-all focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <button
          type="button"
          onClick={ () => setNotificationsOpen(true) }
          className="relative rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          aria-label={ `Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}` }
          aria-haspopup="dialog"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
            />
          </svg>
          { unreadCount > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white"
              aria-hidden="true"
            >
              { unreadCount > 9 ? "9+" : unreadCount }
            </span>
          ) }
        </button>

        <div className="border-l border-slate-200/80 pl-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Open profile menu"
                className="flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-1.5 text-left transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
                <ChevronDown
                  className="hidden h-4 w-4 text-slate-400 lg:block"
                  aria-hidden="true"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 rounded-xl border border-slate-200 bg-white p-1 shadow-elevated ring-0"
            >
              <DropdownMenuLabel className="px-2 py-2">
                <span className="flex items-center gap-2.5">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate text-sm font-semibold text-slate-800">
                      { displayName }
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      { displayRole }
                    </span>
                  </span>
                </span>
              </DropdownMenuLabel>
              <DropdownMenuItem
                onSelect={() => setUpdatePasswordOpen(true)}
                className="cursor-pointer px-2 py-2 text-slate-700"
              >
                <KeyRound />
                Update password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={handleSignOut}
                variant="destructive"
                className="cursor-pointer px-2 py-2"
              >
                <LogOut />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      { mounted &&
        createPortal(
          <>
            <NotificationPanel
              open={ notificationsOpen }
              onClose={ () => setNotificationsOpen(false) }
              notifications={ notifications }
              onMarkRead={ handleMarkRead }
              onMarkAllRead={ handleMarkAllRead }
              onDismiss={ handleDismiss }
            />
            <UpdatePasswordDialog
              open={ updatePasswordOpen }
              onClose={ () => setUpdatePasswordOpen(false) }
            />
          </>,
          document.body,
        ) }
    </header>
  );
}

export default Header;
