/**
 * Clears client-side state on sign-out or session reset: the React Query
 * cache plus in-memory page filters and toasts.
 */
import { queryClient } from "@/lib/queryClient";
import { usePageViewStore } from "./pageViewStore";
import { useToastStore } from "./toastStore";

/** Clears the query cache, page-view filters, and visible toasts. */
export function resetClientState() {
  // Reset in dependency order: server cache, page filters, then transient toasts.
  queryClient.clear();
  usePageViewStore.getState().reset();
  useToastStore.getState().clear();
}
