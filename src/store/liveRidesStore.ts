/**
 * Live rides store for the operations dashboard: ride list, per-ride
 * simulation sessions, mock operator actions, and the tick that advances
 * positions/statuses. `LIVE_RIDES_USE_MOCK_DATA` sets the initial connection.
 */
import { create } from "zustand";
import type { LiveRide, LiveRideStatus } from "@/lib/liveRides";
import {
  haversineKm,
  interpolatePosition,
  bearingDegrees,
} from "@/lib/liveRides";
import {
  createMockLiveRide,
  cancelMockLiveRide,
  flagMockLiveRide,
  addMockLiveRideNote,
  escalateMockLiveRide,
  overrideMockLiveRideFare,
  getMockLiveRideHistory,
  resetMockLiveRides,
} from "@/lib/liveRidesMock";
import { LIVE_RIDES_USE_MOCK_DATA } from "@/lib/liveRides";

type RideSession = {
  leg: "toPickup" | "toDropoff";
  progress: number;
  atPickupSince?: number;
};

interface LiveRidesStore {
  rides: LiveRide[];
  sessions: Map<string, RideSession>;
  lastUpdatedAt: string;
  connection: "connected" | "connecting" | "disconnected" | "mock";
  selectedRideId: string | null;
  /** Replaces the ride list, dropping duplicate ids. */
  setRides: (rides: LiveRide[]) => void;
  /** Updates the "last refreshed" timestamp shown in the header. */
  setLastUpdatedAt: (ts: string) => void;
  /** Sets the transport indicator (socket vs. mock). */
  setConnection: (c: LiveRidesStore["connection"]) => void;
  /** Selects the ride shown in the detail panel; null clears selection. */
  selectRide: (rideId: string | null) => void;
  /** Inserts or replaces a ride produced by the mock backend. */
  applyMockRide: (ride: LiveRide) => void;
  /**
   * Cancels a ride through the mock backend and replaces it in the list.
   * `refund` is the refund mode, `partialPercent` the refund share when
   * partial, and `penalize` whether to apply the cancellation penalty.
   */
  cancelRide: (
    rideId: string,
    reason: string,
    refund: string,
    partialPercent: number,
    penalize: boolean,
  ) => void;
  /** Flags a ride with a reason and stores the updated mock record. */
  flagRide: (rideId: string, reason: string) => void;
  /** Appends an operator note to a ride. */
  addNote: (rideId: string, text: string) => void;
  /** Escalates a ride with a note and stores the updated mock record. */
  escalate: (rideId: string, note: string) => void;
  /** Overrides the ride fare with `amount` and records the reason. */
  overrideFare: (rideId: string, amount: number, reason: string) => void;
  /** Returns the mock event history for a ride, oldest first. */
  getHistory: (
    rideId: string,
  ) => Array<{ time: string; event: string; detail?: string }>;
  /** Seeds simulation sessions for the current rides; no-op when already running. */
  startSimulation: () => void;
  /** Stops simulation by discarding all sessions. */
  stopSimulation: () => void;
  /** Advances positions, statuses, ETA, and mock spawning by one tick. */
  tick: () => void;
  /** Clears mock storage and resets the store to its empty state. */
  reset: () => void;
}

const STATUS_ORDER: LiveRideStatus[] = [
  "accepted",
  "arrived",
  "picked_up",
  "near_dropoff",
  "completed",
];

const distanceKm = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number => haversineKm(a.lat, a.lng, b.lat, b.lng);

const dedupeById = (rides: LiveRide[]): LiveRide[] => {
  const seen = new Set<string>();
  return rides.filter((ride) => {
    if (seen.has(ride.id)) return false;
    seen.add(ride.id);
    return true;
  });
};

// ETA values are only recomputed every 30 seconds rather than on every tick.
let lastEtaTick = Date.now();

/**
 * Zustand store for live ride monitoring. `sessions` tracks the active
 * simulation leg and progress per ride; `tick()` mutates it in place and
 * publishes a new, status-sorted ride list.
 */
export const useLiveRidesStore = create<LiveRidesStore>((set, get) => ({
  rides: [],
  sessions: new Map(),
  lastUpdatedAt: new Date().toISOString(),
  connection: LIVE_RIDES_USE_MOCK_DATA ? "mock" : "disconnected",
  selectedRideId: null,

  setRides: (rides) => set({ rides: dedupeById(rides) }),
  setLastUpdatedAt: (ts) => set({ lastUpdatedAt: ts }),
  setConnection: (connection) => set({ connection }),
  selectRide: (rideId) => set({ selectedRideId: rideId }),

  applyMockRide: (ride) =>
    set((state) => {
      const existing = state.rides.find((r) => r.id === ride.id);
      if (existing) {
        return { rides: state.rides.map((r) => (r.id === ride.id ? ride : r)) };
      }
      return { rides: [ride, ...state.rides] };
    }),

  cancelRide: (rideId, reason, refund, partialPercent, penalize) => {
    const ride = cancelMockLiveRide(
      rideId,
      reason,
      refund as any,
      partialPercent,
      penalize,
    );
    set((state) => ({
      rides: state.rides.map((r) => (r.id === rideId ? ride : r)),
    }));
  },

  flagRide: (rideId, reason) => {
    const ride = flagMockLiveRide(rideId, reason);
    set((state) => ({
      rides: state.rides.map((r) => (r.id === rideId ? ride : r)),
    }));
  },

  addNote: (rideId, text) => {
    const ride = addMockLiveRideNote(rideId, text);
    set((state) => ({
      rides: state.rides.map((r) => (r.id === rideId ? ride : r)),
    }));
  },

  escalate: (rideId, note) => {
    const ride = escalateMockLiveRide(rideId, note);
    set((state) => ({
      rides: state.rides.map((r) => (r.id === rideId ? ride : r)),
    }));
  },

  overrideFare: (rideId, amount, reason) => {
    const ride = overrideMockLiveRideFare(rideId, amount, reason);
    set((state) => ({
      rides: state.rides.map((r) => (r.id === rideId ? ride : r)),
    }));
  },

  getHistory: (rideId) => getMockLiveRideHistory(rideId),

  startSimulation: () => {
    if (get().sessions.size === 0 && get().rides.length > 0) {
      const sessions = new Map<string, RideSession>();
      get().rides.forEach((ride) => {
        sessions.set(ride.id, { leg: "toPickup", progress: 0 });
      });
      set({ sessions });
    }
  },

  stopSimulation: () => {
    set({ sessions: new Map() });
  },

  reset: () => {
    resetMockLiveRides();
    lastEtaTick = Date.now();
    set({
      rides: [],
      sessions: new Map(),
      lastUpdatedAt: new Date().toISOString(),
    });
  },

  tick: () => {
    const state = get();
    const now = Date.now();
    const etaDue = now - lastEtaTick >= 30_000;

    const nextRides: LiveRide[] = [];
    const nextSessions = new Map(state.sessions);

    for (const ride of state.rides) {
      let updated = { ...ride };
      const session = nextSessions.get(ride.id) ?? {
        leg: "toPickup",
        progress: 0,
      };
      const statusIdx = STATUS_ORDER.indexOf(ride.status);
      const target = session.leg === "toPickup" ? ride.pickup : ride.dropoff;

      if (ride.status !== "completed") {
        // Speed is per-hour, so scale it down for the tick and keep a floor so
        // slow or stopped rides still make visible progress.
        const speedKmPerTick = Math.max(ride.position.speed / 12, 0.6);
        const legLength = distanceKm(ride.position, target);
        const progressStep =
          legLength > 0 ? speedKmPerTick / Math.max(legLength, 0.1) : 0;
        session.progress = Math.min(1, session.progress + progressStep);

        const interp = interpolatePosition(
          ride.position,
          target,
          session.progress,
        );
        updated.position = {
          ...interp,
          heading: bearingDegrees(
            interp.lat,
            interp.lng,
            target.lat,
            target.lng,
          ),
          speed: ride.position.speed,
        };

        if (session.progress >= 1) {
          session.progress = 0;
          if (session.leg === "toPickup") {
            if (ride.status === "accepted") {
              updated.status = "arrived";
              updated.statusChangedAt = new Date().toISOString();
              session.atPickupSince = now;
            } else {
              session.leg = "toDropoff";
            }
          } else {
            const nextIdx = statusIdx + 1;
            if (nextIdx < STATUS_ORDER.length) {
              updated.status = STATUS_ORDER[nextIdx];
              updated.statusChangedAt = new Date().toISOString();
              if (STATUS_ORDER[nextIdx] === "completed") {
                updated.removedAt = new Date().toISOString();
              }
            }
          }
        }

        if (etaDue) {
          const remaining = distanceKm(updated.position, ride.dropoff);
          updated.etaMin = Math.max(
            1,
            Math.round((remaining / Math.max(updated.position.speed, 5)) * 60),
          );
        }

        // Occasionally jump to the next status to keep the demo lively.
        if (Math.random() < 0.08 && statusIdx < STATUS_ORDER.length - 1) {
          updated.status = STATUS_ORDER[statusIdx + 1];
          updated.statusChangedAt = new Date().toISOString();
          session.progress = 0;
          if (updated.status === "completed")
            updated.removedAt = new Date().toISOString();
        }
      }

      // Completed rides linger briefly so the UI can show the transition.
      if (ride.status === "completed" && ride.removedAt) {
        const age = now - new Date(ride.removedAt).getTime();
        if (age < 10_000) nextRides.push(updated);
        nextSessions.delete(ride.id);
      } else {
        nextRides.push(updated);
      }
    }

    if (lastEtaTick <= now - 30_000) lastEtaTick = now;

    // Keep the board populated without letting it grow unbounded.
    if (nextRides.length < 30 && Math.random() < 0.15) {
      const fresh = createMockLiveRide();
      if (!nextRides.some((r) => r.id === fresh.id)) {
        nextSessions.set(fresh.id, { leg: "toPickup", progress: 0 });
        nextRides.unshift(fresh);
      }
    }

    set({
      rides: dedupeById(nextRides).sort(
        (a, b) =>
          new Date(b.statusChangedAt).getTime() -
          new Date(a.statusChangedAt).getTime(),
      ),
      sessions: nextSessions,
      lastUpdatedAt: new Date().toISOString(),
    });
  },
}));
