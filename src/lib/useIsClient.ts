"use client";

// Client-detection hook. Reports whether code is running in the browser after
// hydration so browser-only work (portals, refs) can be deferred safely.

import { useSyncExternalStore } from "react";

// No-op subscription: the value never changes after mount.
const subscribe = () => () => {};

// True once the app is running in the browser. Used to defer portal rendering
// and other browser-only work until after hydration, without setting state
// from an effect.
/**
 * Returns false during SSR and the first render, then true on the client.
 *
 * Implemented with useSyncExternalStore so it stays hydration-safe without
 * setting state from an effect.
 */
export function useIsClient() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
