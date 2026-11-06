import { create } from "zustand";
import type { AuthSession } from "@/types/models";
import { getSessionSnapshot, subscribeSession } from "@/services/tokenStore";

type AuthState = {
  session: AuthSession | null;
  hydrated: boolean;
  hydrate: () => void;
};

let hydrated = false;

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
