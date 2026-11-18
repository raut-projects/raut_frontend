"use client";

/**
 * Google Maps loader for live-map views.
 * Injects the Maps JavaScript API once, reports loading state, and degrades to
 * a missing-key status when no API key is configured. Collaborates with
 * lib/config, the browser script loader and window.google.
 */
import { useState, useEffect } from "react";
import { GOOGLE_MAPS_API_KEY, hasGoogleMapsKey } from "@/lib/config";

function loadGoogleMaps(key: string): Promise<any> {
  return new Promise((resolve, reject) => {
    // Script load and API readiness are separate: poll until the maps
    // namespace exists instead of assuming onload is sufficient.
    const check = () => {
      const g = (window as any).google;
      if (g?.maps) return resolve(g);
      setTimeout(check, 100);
    };
    if ((window as any).google?.maps) return check();
    const script = document.createElement("script");
    // `visualization` powers the live-map heat layer; `weekly` avoids pinning.
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=visualization&v=weekly`;
    script.async = true;
    script.onload = () => check();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * Loads the Google Maps JavaScript API on demand.
 *
 * Status starts as `missing-key` when no key is configured, and no script is
 * injected. Otherwise it starts as `loading`; a deferred timer injects the
 * script and settles on `ready` with the `google` namespace or `error` if the
 * script fails. Existing `window.google.maps` or a resolved `google` state
 * short-circuits duplicate loads. Cleanup cancels the pending timer and
 * ignores late resolutions after unmount.
 *
 * @returns `{ status, google }`, where status is missing-key | loading | ready | error.
 */
export function useGoogleMaps() {
  const [status, setStatus] = useState<
    "missing-key" | "loading" | "ready" | "error"
  >(() => (hasGoogleMapsKey ? "loading" : "missing-key"));
  const [google, setGoogle] = useState<any>(null);

  useEffect(() => {
    if (!hasGoogleMapsKey) {
      return;
    }
    if (google) return;
    let cancelled = false;
    // Defer the injection one macrotask so Strict Mode cleanup can cancel it.
    const timer = setTimeout(async () => {
      try {
        const g = await loadGoogleMaps(GOOGLE_MAPS_API_KEY);
        if (!cancelled) {
          setGoogle(g);
          setStatus("ready");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [google, hasGoogleMapsKey]);

  return { status, google };
}
