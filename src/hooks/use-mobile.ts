/**
 * Client-side responsive helper for the admin dashboard shell.
 * Exposes a media-query backed boolean so layout components can branch
 * between mobile and desktop without managing resize listeners themselves.
 * Collaborates with React's external store and window.matchMedia.
 */
import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

const subscribe = (onChange: () => void) => {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
};

const getSnapshot = () => window.innerWidth < MOBILE_BREAKPOINT;
const getServerSnapshot = () => false;

/**
 * Reports whether the viewport is narrower than the 768px mobile breakpoint.
 *
 * Subscribes to a `(max-width: 767px)` media query through
 * `useSyncExternalStore`, so consumers re-render when the breakpoint changes
 * without manual resize listeners. The server snapshot is `false`, keeping
 * hydration deterministic until the client subscribes.
 *
 * @returns `true` when the viewport is below the mobile breakpoint.
 */
export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
