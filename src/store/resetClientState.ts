import { usePageViewStore } from "./pageViewStore";
import { useSupportTicketsStore } from "./supportTicketsStore";
import { useToastStore } from "./toastStore";

export function resetClientState() {
  usePageViewStore.getState().reset();
  useSupportTicketsStore.getState().reset();
  useToastStore.getState().clear();
}
