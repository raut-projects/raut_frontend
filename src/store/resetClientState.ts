import { queryClient } from "@/lib/queryClient";
import { usePageViewStore } from "./pageViewStore";
import { useToastStore } from "./toastStore";

export function resetClientState() {
  queryClient.clear();
  usePageViewStore.getState().reset();
  useToastStore.getState().clear();
}
