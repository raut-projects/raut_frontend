"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  CarFront,
  ChevronRight,
  CreditCard,
  Gift,
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
import { usePermissions } from "@/hooks/usePermissions";
import {
  NAV_GROUPS,
  SETTINGS_ITEMS,
  type NavIconName,
  type NavItem,
} from "@/lib/navigation";
import { normalizePath } from "@/lib/permissions";
import { signOut } from "@/services/auth";

const navIcons: Record<NavIconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  liveRides: MapIcon,
  drivers: CarFront,
  customers: Users,
  rides: MapPin,
  routes: Route,
  payouts: Wallet,
  transactions: CreditCard,
  promotions: Megaphone,
  referrals: Gift,
  support: Ticket,
  analytics: BarChart3,
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const { has } = usePermissions();
  const { setOpenMobile, state, setOpen, isMobile } = useSidebar();

  const visibleGroups = NAV_GROUPS
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.permission || has(item.permission),
      ),
    }))
    .filter((group) => group.items.length > 0);

  const visibleSettingsItems = SETTINGS_ITEMS.filter(
    (item) => !item.permission || has(item.permission),
  );

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

  const isItemActive = (item: NavItem) => {
    if (item.exact) return currentPath === normalizePath(item.url);

    return isActive(item.activeOn ?? item.url);
  };

  const handleSignOut = () => {
    signOut();
    setOpenMobile(false);
    router.replace("/login");
  };

  return (
    <Sidebar collapsible="icon" className="print:hidden" { ...props }>
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
        { visibleGroups.map((group, index) => (
          <SidebarGroup key={ group.label ?? `home-${index}` }>
            { group.label ? (
              <SidebarGroupLabel className="px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                { group.label }
              </SidebarGroupLabel>
            ) : null }
            <SidebarMenu>
              { group.items.map((item) => {
                const Icon = navIcons[item.icon];
                const active = isItemActive(item);

                return (
                  <SidebarMenuItem key={ item.title }>
                    <SidebarMenuButton
                      asChild
                      isActive={ active }
                      tooltip={ item.title }
                    >
                      <Link href={ item.url }>
                        <Icon />
                        <span>{ item.title }</span>
                      </Link>
                    </SidebarMenuButton>
                    { item.badge ? (
                      <SidebarMenuBadge>{ item.badge }</SidebarMenuBadge>
                    ) : null }
                  </SidebarMenuItem>
                );
              }) }
            </SidebarMenu>
          </SidebarGroup>
        )) }

        { visibleSettingsItems.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel className="px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              System
            </SidebarGroupLabel>
            <SidebarMenu>
              <Collapsible
                key={ settingsActive ? "settings-open" : "settings-closed" }
                defaultOpen={ settingsActive }
                className="group/collapsible"
                onOpenChange={ (open) => {
                  if (open && state === "collapsed" && !isMobile) {
                    setOpen(true);
                  }
                } }
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip="Settings"
                      isActive={ settingsActive }
                    >
                      <Settings />
                      <span>Settings</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      { visibleSettingsItems.map((item) => (
                        <SidebarMenuSubItem key={ item.title }>
                          <SidebarMenuSubButton
                            asChild
                            isActive={ isActive(item.url) }
                          >
                            <Link href={ item.url }>
                              <span>{ item.title }</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )) }
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroup>
        ) : null }
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Logout"
              onClick={ handleSignOut }
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
