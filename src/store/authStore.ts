/**
 * Auth session store wrapping the token-store snapshot in Zustand. Hydration
 * is deferred to the client so the static export renders an empty session.
 */
import { create } from "zustand";
import type { AuthSession } from "@/types/models";
import { getSessionSnapshot, subscribeSession } from "@/services/tokenStore";

type AuthState = {
  session: AuthSession | null;
  hydrated: boolean;
  /** Reads the session once and subscribes to later token-store changes. */
  hydrate: () => void;
};

let hydrated = false;

/**
 * Zustand store exposing the current session and a one-time hydration action.
 * `session` is null until `hydrate()` runs; `hydrated` flips once the snapshot
 * has been read.
 */
export const useAuthStore = create<AuthState>()((set) => ({
  session: null,
  hydrated: false,

  // The session starts empty so the first client render matches the static
  // export. It is filled from the token store once the browser is available.
  hydrate: () => {
    if (hydrated || typeof window === "undefined") return;

    hydrated = true;
    set({ session: getSessionSnapshot(), hydrated: true });

    subscribeSession(() => {
      set({ session: getSessionSnapshot() });
    });
  },
}));
