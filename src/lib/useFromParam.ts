"use client";

// Redirect-target helper for auth flows. Reads the `from` query parameter and
// validates that it is a safe internal path before returning it.

import { useState } from "react";

/**
 * Returns `value` when it is a safe internal path, otherwise `fallback`.
 *
 * Rejects empty values, anything not starting with "/", protocol-relative
 * "//" paths, and the login page itself (to avoid redirect loops).
 */
const toInternalPath = (value: string | null, fallback: string) => {
  if (!value || !value.startsWith("/") || value.startsWith("//"))
    return fallback;
  if (value === "/login") return fallback;

  return value;
};

// Reads the `from` query parameter used to send a user back to the page they
// originally asked for. Reading it from `window` (instead of
// `useSearchParams`) keeps static export from requiring a Suspense boundary.
/**
 * Returns the validated `from` query parameter for the current page.
 *
 * Read once on mount from `window.location` (SSR-safe: uses `fallback` when
 * `window` is unavailable). Defaults to "/".
 */
export function useFromParam(fallback = "/") {
  const [from] = useState(() => {
    if (typeof window === "undefined") return fallback;

    return toInternalPath(
      new URLSearchParams(window.location.search).get("from"),
      fallback,
    );
  });

  return from;
}
