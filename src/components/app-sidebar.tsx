"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Car,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  MapPin,
  Megaphone,
  Route,
  Settings,
  Ticket,
  Users,
  Wallet,
  // BadgeAlert,
  type LucideIcon,
} from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSession } from "@/hooks/useSession";
import { signOut } from "@/services/auth";

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  badge?: string;
  activeOn?: string;
};

type NavGroup = {
  label?: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
        // badge: "Home",
      },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Live Rides", url: "/live-rides", icon: MapIcon },
      { title: "Drivers", url: "/drivers", icon: Car },
      { title: "Customers", url: "/customers", icon: Users },
      { title: "Rides", url: "/rides", icon: MapPin },
      { title: "Routes", url: "/routes", icon: Route, badge: "DUO" },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Payouts", url: "/payouts", icon: Wallet },
      { title: "Transactions", url: "/transactions", icon: CreditCard },
    ],
  },
  {
    label: "Marketing",
    items: [{ title: "Promotions", url: "/promotions", icon: Megaphone }],
  },
  {
    label: "Support",
    items: [
      { title: "Support Tickets", url: "/support-tickets", icon: Ticket },
      // { title: "Customer Issues", url: "/customer-issues", icon: BadgeAlert },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        title: "Analytics",
        url: "/",
        icon: BarChart3,
        activeOn: "/analytics",
      },
    ],
  },
];

const settingsItems = [
  { title: "Platform Config", url: "/settings/platform" },
  { title: "Admin Users", url: "/settings/admin-users" },
  { title: "Audit Logs", url: "/settings/audit-logs" },
  { title: "System Health", url: "/settings/system-health" },
];

const normalizePath = (value: string) => value.replace(/\/+$/, "") || "/";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useSession();
  const { setOpenMobile } = useSidebar();

  const currentPath = normalizePath(pathname);
  const settingsActive =
    currentPath === "/settings" || currentPath.startsWith("/settings/");

  const isActive = (target: string) => {
    const normalizedTarget = normalizePath(target);

    if (normalizedTarget === "/") return currentPath === "/";

    return (
      currentPath === normalizedTarget ||
      currentPath.startsWith(`${normalizedTarget}/`)
    );
  };

  const isItemActive = (item: NavItem) => isActive(item.activeOn ?? item.url);

  const handleSignOut = () => {
    signOut();
    queryClient.clear();
    setOpenMobile(false);
    router.replace("/login");
  };

  return (
    <Sidebar collapsible="icon" className="print:hidden" {...props}>
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="RAUT Dashboard">
              <Link href="/">
                <img
                  src="/logo.png"
                  alt="RAUT"
                  className="size-8 shrink-0 rounded-lg object-contain"
                />
                <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate text-sm font-bold tracking-tight text-slate-900">
                    RAUT
                  </span>
                  <span className="truncate text-xs text-slate-500">
                    Dashboard
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group, index) => (
          <SidebarGroup key={group.label ?? `home-${index}`}>
            {group.label ? (
              <SidebarGroupLabel className="px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {group.label}
              </SidebarGroupLabel>
            ) : null}
            <SidebarMenu>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        <Icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.badge ? (
                      <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}

        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            System
          </SidebarGroupLabel>
          <SidebarMenu>
            <Collapsible
              key={settingsActive ? "settings-open" : "settings-closed"}
              defaultOpen={settingsActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip="Settings"
                    isActive={settingsActive}
                  >
                    <Settings />
                    <span>Settings</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {settingsItems.map((item) => (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isActive(item.url)}
                        >
                          <Link href={item.url}>
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Logout"
              onClick={handleSignOut}
              className="text-slate-600 hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
