import { useSyncExternalStore } from "react";
import { getSessionSnapshot, subscribeSession } from "../services/tokenStore";

const getServerSnapshot = () => null;

export function useSession() {
  return useSyncExternalStore(
    subscribeSession,
    getSessionSnapshot,
    getServerSnapshot,
  );
}
