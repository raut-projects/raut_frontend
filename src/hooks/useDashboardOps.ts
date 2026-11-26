"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DASHBOARD_USE_MOCK_DATA, DASHBOARD_WS_URL } from "@/lib/config";
import { polledQueryOptions } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import {
  getMockDashboardStats,
  nextMockCompletedRevenue,
  nextMockDashboardAlert,
  nextMockDriverCount,
  nextMockStatsUpdate,
} from "@/lib/dashboardOpsMock";
import {
  getDashboardAlerts,
  getDashboardStats,
  getHealthServices,
  getHourlyRevenue,
} from "@/services/dashboardOps";
import {
  DashboardSocket,
  type DashboardRealtimeMessage,
} from "@/services/dashboardSocket";
import type {
  DashboardAlert,
  DashboardStats,
  HourlyRevenuePoint,
} from "@/types/dashboardOps";

export type DashboardConnection = "mock" | "connected" | "disconnected";

const asRecord = (value: unknown): Record<string, any> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : null;

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: ({ signal }) => getDashboardStats({ signal }),
    ...polledQueryOptions,
    refetchInterval: 10_000,
  });
}

export function useDashboardAlerts() {
  return useQuery({
    queryKey: queryKeys.dashboard.alerts,
    queryFn: ({ signal }) => getDashboardAlerts({ signal }),
    ...polledQueryOptions,
    refetchInterval: 30_000,
  });
}

export function useHourlyRevenue() {
  return useQuery({
    queryKey: queryKeys.dashboard.hourlyRevenue("today"),
    queryFn: ({ signal }) => getHourlyRevenue("today", { signal }),
    ...polledQueryOptions,
    refetchInterval: 3_600_000,
  });
}

export function useHealthServices() {
  return useQuery({
    queryKey: queryKeys.dashboard.health,
    queryFn: ({ signal }) => getHealthServices({ signal }),
    ...polledQueryOptions,
    refetchInterval: 30_000,
  });
}

export function useDashboardRealtime() {
  const queryClient = useQueryClient();
  const [connection, setConnection] = useState<DashboardConnection>(
    DASHBOARD_USE_MOCK_DATA ? "mock" : "disconnected",
  );

  useEffect(() => {
    if (!DASHBOARD_USE_MOCK_DATA) return;
    let tick = 0;
    const timer = setInterval(() => {
      tick += 1;
      if (tick % 3 === 0) {
        queryClient.setQueryData<DashboardStats>(
          queryKeys.dashboard.stats,
          (current) =>
            current ? nextMockStatsUpdate(current) : getMockDashboardStats(),
        );
      } else if (tick % 3 === 1) {
        queryClient.setQueryData<DashboardStats>(
          queryKeys.dashboard.stats,
          (current) => {
            if (!current) return current;
            const todayRevenue = nextMockCompletedRevenue(current.todayRevenue);
            const fare = todayRevenue - current.todayRevenue;
            queryClient.setQueryData<HourlyRevenuePoint[]>(
              queryKeys.dashboard.hourlyRevenue("today"),
              (points) =>
                points?.length
                  ? points.map((point, index) =>
                      index === points.length - 1
                        ? { ...point, amount: point.amount + fare }
                        : point,
                    )
                  : points,
            );
            return {
              ...current,
              todayRevenue,
              activeRides: Math.max(0, current.activeRides - 1),
              updatedAt: new Date().toISOString(),
            };
          },
        );
      } else {
        queryClient.setQueryData<DashboardStats>(
          queryKeys.dashboard.stats,
          (current) =>
            current
              ? {
                  ...current,
                  onlineDrivers: nextMockDriverCount(current.onlineDrivers),
                  updatedAt: new Date().toISOString(),
                }
              : current,
        );
      }
      if (tick % 4 === 0) {
        const alert = nextMockDashboardAlert();
        queryClient.setQueryData<DashboardAlert[]>(
          queryKeys.dashboard.alerts,
          (current) =>
            current?.some((entry) => entry.id === alert.id)
              ? current
              : [alert, ...(current ?? [])],
        );
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [queryClient]);

  useEffect(() => {
    if (DASHBOARD_USE_MOCK_DATA || !DASHBOARD_WS_URL) return;
    const handleMessage = (message: DashboardRealtimeMessage) => {
      const payload = asRecord(message.data);
      if (message.type === "stats:update") {
        if (!payload) return;
        queryClient.setQueryData<DashboardStats>(
          queryKeys.dashboard.stats,
          (current) =>
            current ? { ...current, ...(payload as Partial<DashboardStats>) } : current,
        );
        return;
      }
      if (message.type === "ride:completed") {
        const amount = Number(
          payload?.amount ?? payload?.fare ?? payload?.revenue ?? 0,
        );
        const fare = Number.isFinite(amount) ? amount : 0;
        queryClient.setQueryData<DashboardStats>(
          queryKeys.dashboard.stats,
          (current) =>
            current
              ? {
                  ...current,
                  todayRevenue: current.todayRevenue + fare,
                  activeRides: Math.max(0, current.activeRides - 1),
                  updatedAt: new Date().toISOString(),
                }
              : current,
        );
        queryClient.setQueryData<HourlyRevenuePoint[]>(
          queryKeys.dashboard.hourlyRevenue("today"),
          (points) =>
            points?.length
              ? points.map((point, index) =>
                  index === points.length - 1
                    ? { ...point, amount: point.amount + fare }
                    : point,
                )
              : points,
        );
        return;
      }
      if (message.type === "driver:status_change") {
        const onlineDrivers = payload?.online_drivers ?? payload?.onlineDrivers;
        queryClient.setQueryData<DashboardStats>(
          queryKeys.dashboard.stats,
          (current) => {
            if (!current) return current;
            const nextCount =
              typeof onlineDrivers === "number"
                ? onlineDrivers
                : Math.max(
                    0,
                    current.onlineDrivers +
                      (payload?.online === false || payload?.status === "offline"
                        ? -1
                        : 1),
                  );
            return {
              ...current,
              onlineDrivers: nextCount,
              updatedAt: new Date().toISOString(),
            };
          },
        );
        return;
      }
      if (message.type === "alert:new") {
        const alert = payload as DashboardAlert | null;
        if (!alert?.id) return;
        queryClient.setQueryData<DashboardAlert[]>(
          queryKeys.dashboard.alerts,
          (current) =>
            current?.some((entry) => entry.id === alert.id)
              ? current
              : [alert, ...(current ?? [])],
        );
      }
    };
    const socket = new DashboardSocket(DASHBOARD_WS_URL, {
      onMessage: handleMessage,
      onConnectionChange: (connected) =>
        setConnection(connected ? "connected" : "disconnected"),
    });
    socket.connect();
    return () => socket.disconnect();
  }, [queryClient]);

  return {
    connected: connection === "connected" || connection === "mock",
    connection,
  };
}
