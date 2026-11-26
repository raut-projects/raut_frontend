"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LIVE_RIDES_WS_URL } from "@/lib/config";
import {
  LIVE_RIDE_FILTER_STATUSES,
  LIVE_RIDES_USE_MOCK_DATA,
  type LiveRide,
} from "@/lib/liveRides";
import { polledQueryOptions } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { listLiveRides } from "@/services/liveRides";
import { LiveRidesSocket } from "@/services/liveRidesSocket";

export type DashboardMapRideFilter = "all" | "private" | "duo" | "issues";
export type DashboardMapConnection = "mock" | "connected" | "disconnected";

export function useDashboardMapRides() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<DashboardMapRideFilter>("all");
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [connection, setConnection] = useState<DashboardMapConnection>(
    LIVE_RIDES_USE_MOCK_DATA ? "mock" : "disconnected",
  );

  const { data: rides = [] } = useQuery({
    queryKey: queryKeys.dashboard.mapRides,
    queryFn: ({ signal }) => listLiveRides({}, { signal }),
    ...polledQueryOptions,
    refetchInterval: 10_000,
  });

  useEffect(() => {
    if (!LIVE_RIDES_USE_MOCK_DATA) return;
    const timer = setInterval(() => setTick((current) => current + 1), 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!LIVE_RIDES_USE_MOCK_DATA || tick === 0) return;
    queryClient.setQueryData<LiveRide[]>(
      queryKeys.dashboard.mapRides,
      (current) =>
        current?.map((ride, index) => {
          const offset = (((tick + index) % 5) - 2) * 0.0002;
          return {
            ...ride,
            position: {
              ...ride.position,
              lat: ride.position.lat + offset,
              lng: ride.position.lng + offset / 2,
            },
          };
        }) ?? current,
    );
  }, [tick, queryClient]);

  useEffect(() => {
    if (LIVE_RIDES_USE_MOCK_DATA || !LIVE_RIDES_WS_URL) return;
    const socket = new LiveRidesSocket(LIVE_RIDES_WS_URL, {
      onRides: (incoming) => {
        if (!incoming.length) return;
        queryClient.setQueryData(queryKeys.dashboard.mapRides, incoming);
      },
      onConnectionChange: (connected) =>
        setConnection(connected ? "connected" : "disconnected"),
    });
    socket.connect();
    return () => socket.disconnect();
  }, [queryClient]);

  const filtered = useMemo(
    () =>
      rides
        .filter((ride) => LIVE_RIDE_FILTER_STATUSES.includes(ride.status))
        .filter((ride) => {
          if (filter === "private") return ride.type === "private";
          if (filter === "duo") return ride.type.startsWith("duo");
          if (filter === "issues") return ride.hasIssue;
          return true;
        })
        .sort(
          (a, b) =>
            new Date(b.statusChangedAt).getTime() -
            new Date(a.statusChangedAt).getTime(),
        ),
    [rides, filter],
  );

  return {
    rides,
    visibleRides: filtered.slice(0, 10),
    filter,
    setFilter,
    selectedRideId,
    setSelectedRideId,
    connection,
  };
}
