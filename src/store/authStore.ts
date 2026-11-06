import { create } from "zustand";
import {
  clearSession,
  getSessionSnapshot,
  subscribeSession,
} from "@/services/tokenStore";

export type AuthSession = {
  id: string | number | null;
  name: string;
  phone: string;
  role: string;
  roleLabel: string;
  initials: string;
  signedInAt: string;
  roleVerifiedAt?: number;
};

type AuthState = {
  session: AuthSession | null;
  hydrate: () => void;
  signOut: () => void;
};

let hydrated = false;

const currentSession = () => (getSessionSnapshot() as AuthSession | null) ?? null;

export const useAuthStore = create<AuthState>()((set) => ({
  session: null,

  // The session starts empty so the first client render matches the static
  // export. It is filled from the token store once the browser is available.
  hydrate: () => {
    if (hydrated || typeof window === "undefined") return;

    hydrated = true;
    set({ session: currentSession() });

    subscribeSession(() => {
      set({ session: currentSession() });
    });
  },

  signOut: () => {
    clearSession();
  },
}));
