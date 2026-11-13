"use client";

/**
 * Live rides controller for the real-time operations map.
 * Normalizes REST bootstrap, websocket streaming and mock simulation into one
 * store-backed hook. It also derives role permissions, persists filters in the
 * page-view store and windows the filtered ride list. Collaborates with
 * liveRidesStore, the liveRides services, useSession and useWindowedList.
 */
import { useEffect, useRef, useCallback, useMemo } from "react";
import { useLiveRidesStore } from "@/store/liveRidesStore";
import { listLiveRides } from "@/services/liveRides";
import { LiveRidesSocket } from "@/services/liveRidesSocket";
import { LIVE_RIDES_WS_URL } from "@/lib/config";
import { LIVE_RIDES_USE_MOCK_DATA } from "@/lib/liveRides";
import { usePageViewField } from "@/store/pageViewStore";
import { useSession } from "@/hooks/useSession";
import { normalizeRole } from "@/lib/roles";
import { isFullControlRole, canEscalateOrNote } from "@/lib/liveRides";
import { useWindowedList } from "./useWindowedList";

/**
 * Drives the live-rides screen from the shared liveRides store.
 *
 * Transport modes: mock mode refetches on filter changes, seeds the simulator
 * and advances it every 5 seconds; otherwise, when `LIVE_RIDES_WS_URL` is set,
 * a websocket streams ride updates after the initial REST snapshot. Filters
 * persist through `usePageViewField`. Permissions are derived from the
 * normalized session role: full-control roles can manage, any other known role
 * is view-only, and escalation/notes are role-gated. The filtered list is
 * sorted by newest status change and windowed with `useWindowedList`.
 *
 * @returns Filters and setters, filtered/visible rides, windowing props,
 *   permissions, connection state and store actions for ride operations.
 */
export function useLiveRides() {
  // Whole-store subscription exposes the actions; scalar fields are selected
  // separately below so rendering values stay stable.
  const api = useLiveRidesStore((s) => s);
  const rides = useLiveRidesStore((s) => s.rides);
  const connection = useLiveRidesStore((s) => s.connection);
  const lastUpdatedAt = useLiveRidesStore((s) => s.lastUpdatedAt);
  const selectedRideIdSel = useLiveRidesStore((s) => s.selectedRideId);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const socketRef = useRef<LiveRidesSocket | null>(null);

  const session = useSession();
  const role = normalizeRole(session?.role ?? null);
  const permissions = {
    canManage: isFullControlRole(role),
    canEscalateNote: canEscalateOrNote(role),
    isViewOnly: !!role && !isFullControlRole(role),
  };

  const [status, setStatus] = usePageViewField("live-rides", "status");
  const [type, setType] = usePageViewField("live-rides", "type");
  const [driverQuery, setDriverQuery] = usePageViewField(
    "live-rides",
    "driverQuery",
  );
  const [customerQuery, setCustomerQuery] = usePageViewField(
    "live-rides",
    "customerQuery",
  );
  const [rideId, setRideId] = usePageViewField("live-rides", "rideId");
  const [issuesOnly, setIssuesOnly] = usePageViewField(
    "live-rides",
    "issuesOnly",
  );
  const [viewMode, setViewMode] = usePageViewField("live-rides", "viewMode");

  // Initial REST snapshot; mock mode also seeds the simulator from it.
  useEffect(() => {
    const load = async () => {
      const fetched = await listLiveRides({
        status,
        type,
        driverQuery,
        customerQuery,
        rideId,
        issuesOnly,
      });
      api.setRides(fetched);
      api.setLastUpdatedAt(new Date().toISOString());
      if (LIVE_RIDES_USE_MOCK_DATA) {
        api.startSimulation();
      }
    };
    load();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!LIVE_RIDES_USE_MOCK_DATA) return;
    (async () => {
      const fetched = await listLiveRides({
        status,
        type,
        driverQuery,
        customerQuery,
        rideId,
        issuesOnly,
      });
      api.setRides(fetched);
      api.startSimulation();
    })();
  }, [status, type, driverQuery, customerQuery, rideId, issuesOnly]);

  useEffect(() => {
    if (!LIVE_RIDES_USE_MOCK_DATA) return;
    intervalRef.current = setInterval(() => api.tick(), 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const connectSocket = useCallback(() => {
    if (!LIVE_RIDES_WS_URL) return;
    const socket = new LiveRidesSocket(LIVE_RIDES_WS_URL, {
      onRides: (fetched) => {
        api.setRides(fetched);
        api.setLastUpdatedAt(new Date().toISOString());
      },
      onConnectionChange: (connected) => {
        api.setConnection(connected ? "connected" : "disconnected");
      },
    });
    socket.connect();
    socketRef.current = socket;
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (LIVE_RIDES_USE_MOCK_DATA || !LIVE_RIDES_WS_URL) return;
    connectSocket();
  }, [connectSocket]);

  const allRides = rides;
  const filtered = useMemo(() => {
    const dq = driverQuery.toLowerCase();
    const cq = customerQuery.toLowerCase();
    const rid = rideId.toLowerCase();
    return allRides
      .filter((ride) => {
        if (status !== "all" && ride.status !== status) return false;
        if (type !== "all" && ride.type !== type) return false;
        if (issuesOnly && !ride.hasIssue) return false;
        if (rid && !ride.displayId.toLowerCase().includes(rid)) return false;
        const driverText =
          `${ride.driver.name} ${ride.driver.id} ${ride.driver.phone}`.toLowerCase();
        if (dq && !driverText.includes(dq)) return false;
        const customerText = ride.customers
          .map((c) => c.name)
          .join(" ")
          .toLowerCase();
        if (cq && !customerText.includes(cq)) return false;
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.statusChangedAt).getTime() -
          new Date(a.statusChangedAt).getTime(),
      );
  }, [allRides, status, type, driverQuery, customerQuery, rideId, issuesOnly]);

  const { containerRef, visible, offsetY, totalHeight, itemHeight, onScroll } =
    useWindowedList({ items: filtered });

  const selectRide = useCallback((rideId: string | null) => {
    api.selectRide(rideId);
  }, []);

  return {
    // mounted,
    permissions,
    status,
    type,
    driverQuery,
    customerQuery,
    rideId,
    issuesOnly,
    viewMode,
    setStatus,
    setType,
    setDriverQuery,
    setCustomerQuery,
    setRideId,
    setIssuesOnly,
    setViewMode,
    allRides,
    filtered,
    visible,
    containerRef,
    offsetY,
    totalHeight,
    itemHeight,
    onScroll,
    selectRide,
    selectedRideId: selectedRideIdSel,
    connection,
    lastUpdatedAt,
    cancelRide: api.cancelRide,
    flagRide: api.flagRide,
    addNote: api.addNote,
    escalate: api.escalate,
    overrideFare: api.overrideFare,
    getHistory: api.getHistory,
  };
}
