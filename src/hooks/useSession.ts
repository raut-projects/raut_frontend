import { useAuthStore } from "../store/authStore";

export function useSession() {
  return useAuthStore((state) => state.session);
}

export function useAuthHydrated() {
  return useAuthStore((state) => state.hydrated);
}
