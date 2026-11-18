/**
 * Session selectors over the auth store.
 * Exposes the current session and hydration state without re-rendering on
 * unrelated store updates. Collaborates with authStore.
 */
import { useAuthStore } from "../store/authStore";

/**
 * Returns the current authenticated session, or null when signed out.
 *
 * @returns The session object from the auth store.
 */
export function useSession() {
  return useAuthStore((state) => state.session);
}

/**
 * Reports whether the auth store has finished hydrating from persisted state.
 *
 * @returns `true` once hydration completes.
 */
export function useAuthHydrated() {
  return useAuthStore((state) => state.hydrated);
}
