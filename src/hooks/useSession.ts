import { useAuthStore } from "../store/authStore";

export function useSession() {
  return useAuthStore((state) => state.session);
}
