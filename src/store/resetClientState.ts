/**
 * Clears client-side state on sign-out or session reset: the React Query
 * cache, cached permissions, page filters and toasts.
 */
import { queryClient } from "@/lib/queryClient";
import { usePageViewStore } from "./pageViewStore";
import { usePermissionStore } from "./permissionStore";
import { useToastStore } from "./toastStore";

export function resetClientState() {
  queryClient.clear();
  usePermissionStore.getState().clear();
  usePageViewStore.getState().reset();
  useToastStore.getState().clear();
}
