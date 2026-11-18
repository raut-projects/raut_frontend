/**
 * Session-facing query for the signed-in operator.
 * Loads the current user through the auth service and exposes it via React
 * Query. Collaborates with queryKeys.me and the shared auth token/session state.
 */
import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUser } from "../services/auth";
import { queryKeys } from "../lib/queryKeys";

/**
 * Fetches the authenticated user.
 *
 * Query key: `me.all`. No enabled gating; callers mount it once a session
 * exists. `staleTime` is 60 seconds, so role checks and profile chrome reuse
 * the cached user instead of refetching on every navigation.
 *
 * @returns A React Query result containing the current user.
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.me.all,
    queryFn: fetchCurrentUser,
    staleTime: 60_000,
  });
}
