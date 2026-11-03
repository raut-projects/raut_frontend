"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// True once the app is running in the browser. Used to defer portal rendering
// and other browser-only work until after hydration, without setting state
// from an effect.
export function useIsClient() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
