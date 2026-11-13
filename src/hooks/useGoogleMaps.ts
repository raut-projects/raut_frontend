"use client";

import { useState, useEffect } from "react";
import { GOOGLE_MAPS_API_KEY, hasGoogleMapsKey } from "@/lib/config";

function loadGoogleMaps(key: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const check = () => {
      const g = (window as any).google;
      if (g?.maps) return resolve(g);
      setTimeout(check, 100);
    };
    if ((window as any).google?.maps) return check();
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=visualization&v=weekly`;
    script.async = true;
    script.onload = () => check();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

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
