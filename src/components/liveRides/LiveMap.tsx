"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { LiveRide } from "@/lib/liveRides";
import { haversineKm } from "@/lib/liveRides";
import {
  carMarkerIcon,
  pinMarkerIcon,
  clusterMarkerIcon,
} from "./markerIcons";

type LiveMapProps = {
  rides: LiveRide[];
  selectedRideId: string | null;
  hoveredRideId: string | null;
  onRideClick: (rideId: string) => void;
  onRideHover: (rideId: string | null) => void;
  google: typeof window.google | null;
  hasGoogleMaps: boolean;
};

const DAR_BOUNDS = {
  north: -6.74,
  south: -6.92,
  east: 39.36,
  west: 39.10,
};

function project(
  lat: number,
  lng: number,
  width: number,
  height: number,
): { x: number; y: number } {
  const x = ((lng - DAR_BOUNDS.west) / (DAR_BOUNDS.east - DAR_BOUNDS.west)) * width;
  const y = (1 - (lat - DAR_BOUNDS.south) / (DAR_BOUNDS.north - DAR_BOUNDS.south)) * height;
  return { x, y };
}

type Cluster = { kind: "cluster"; count: number; lat: number; lng: number; rides: LiveRide[] } | { kind: "ride"; ride: LiveRide };

function clusterRides(rides: LiveRide[], zoom: number): Cluster[] {
  const cellSize = zoom < 10 ? 0.05 : zoom < 13 ? 0.02 : 0.008;
  const grid = new Map<string, LiveRide[]>();
  for (const ride of rides) {
    const key = `${Math.round(ride.position.lat / cellSize)}_${Math.round(ride.position.lng / cellSize)}`;
    const group = grid.get(key) ?? [];
    group.push(ride);
    grid.set(key, group);
  }
  const clusters: Cluster[] = [];
  for (const group of grid.values()) {
    if (group.length === 1) {
      clusters.push({ kind: "ride", ride: group[0] });
    } else {
      const lat = group.reduce((s, r) => s + r.position.lat, 0) / group.length;
      const lng = group.reduce((s, r) => s + r.position.lng, 0) / group.length;
      clusters.push({ kind: "cluster", count: group.length, lat, lng, rides: group });
    }
  }
  return clusters;
}

export default function LiveMap({
  rides,
  selectedRideId,
  hoveredRideId,
  onRideClick,
  onRideHover,
  google,
  hasGoogleMaps,
}: LiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [zoom, setZoom] = useState(12);
  const markersRef = useRef<{ marker: any; polyline?: any; cluster?: any }[]>([]);

  const clearOverlays = useCallback(() => {
    markersRef.current.forEach((m) => {
      m.marker?.setMap?.(null);
      m.polyline?.setMap?.(null);
      m.cluster?.setMap?.(null);
    });
    markersRef.current = [];
  }, []);

  const renderOverlays = useCallback(
    (gMap: any, z: number) => {
      if (!google || !gMap) return;
      clearOverlays();
      const groups = clusterRides(rides, z);
      for (const group of groups) {
        if (group.kind === "cluster") {
          const marker = new google.maps.Marker({
            position: { lat: group.lat, lng: group.lng },
            map: gMap,
            icon: clusterMarkerIcon(group.count),
            title: `${group.count} rides`,
            clickable: true,
          });
          marker.addListener("click", () => {
            const bounds = new google.maps.LatLngBounds();
            group.rides.forEach((r) => bounds.extend({ lat: r.position.lat, lng: r.position.lng }));
            gMap.fitBounds(bounds);
          });
          markersRef.current.push({ marker, cluster: marker });
        } else {
          const ride = group.ride;
          const isSelected = ride.id === selectedRideId;
          const isHovered = ride.id === hoveredRideId;
          const marker = new google.maps.Marker({
            position: { lat: ride.position.lat, lng: ride.position.lng },
            map: gMap,
            icon: {
              url: carMarkerIcon(ride.position.heading, isSelected ? "#dc2626" : "#2563eb"),
              scaledSize: new google.maps.Size(34, 34),
              anchor: new google.maps.Point(17, 17),
              rotation: ride.position.heading,
            },
            title: `${ride.displayId} - ${ride.driver.name}`,
            clickable: true,
          });
          const polyline = new google.maps.Polyline({
            path: [
              { lat: ride.pickup.lat, lng: ride.pickup.lng },
              { lat: ride.dropoff.lat, lng: ride.dropoff.lng },
            ],
            map: gMap,
            strokeColor: "#2563eb",
            strokeOpacity: 0.35,
            strokeWeight: 2,
            icons: [{ icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW }, offset: "100%" }],
          });
          marker.addListener("click", () => onRideClick(ride.id));
          marker.addListener("mouseover", () => onRideHover(ride.id));
          marker.addListener("mouseout", () => onRideHover(null));
          markersRef.current.push({ marker, polyline });
        }
      }
    },
    [google, rides, selectedRideId, hoveredRideId, onRideClick, onRideHover, clearOverlays],
  );

  // --- Google Maps ---
  useEffect(() => {
    if (!google || !mapRef.current || map) return;
    const gMap = new google.maps.Map(mapRef.current, {
      center: { lat: -6.7924, lng: 39.2083 },
      zoom: 12,
      disableDefaultUI: true,
      fullscreenControl: true,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      backgroundColor: "#f3f4f6",
    });
    setMap(gMap);
    new google.maps.TrafficLayer().setMap(gMap);
    gMap.addListener("zoom_changed", () => setZoom(gMap.getZoom()));
  }, [google, map]);

  // --- draw overlays ---
  useEffect(() => {
    if (map && google) renderOverlays(map, zoom);
  }, [map, google, zoom, renderOverlays]);

  // --- Fallback SVG map ---
  const fallbackClusters = useMemo(() => clusterRides(rides, 12), [rides]);

  return (
    <div
      className="relative w-full h-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200"
      style={ { height: "100%" } }
    >
      {/* Google Maps owns this node. React must never render children here. */ }
      <div ref={ mapRef } className="absolute inset-0" />

      { !(google && map) && (
        <div className="absolute inset-0">
          <svg
            className="w-full h-full"
            viewBox="0 0 1000 700"
            preserveAspectRatio="xMidYMid slice"
            onMouseLeave={ () => onRideHover(null) }
          >
            <rect width="1000" height="700" fill="#f3f4f6" />
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="2" orient="auto">
                <path d="M0,0 L0,4 L8,2 z" fill="#9ca3af" />
              </marker>
            </defs>
            {/* routes */ }
            { fallbackClusters.map((group, i) => {
              if (group.kind === "cluster") return null;
              const ride = group.ride;
              const { x: pX, y: pY } = project(ride.pickup.lat, ride.pickup.lng, 1000, 700);
              const { x: dX, y: dY } = project(ride.dropoff.lat, ride.dropoff.lng, 1000, 700);
              return (
                <path
                  key={ ride.id }
                  d={ `M${pX},${pY} L${dX},${dY}` }
                  stroke="#2563eb"
                  strokeOpacity="0.3"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                  markerEnd="url(#arrow)"
                />
              );
            }) }
            {/* markers */ }
            { fallbackClusters.map((group) => {
              if (group.kind === "cluster") {
                const { x, y } = project(group.lat, group.lng, 1000, 700);
                return (
                  <g key={ `c-${group.lat}-${group.lng}` } onClick={ () => { } } transform={ `translate(${x},${y})` }>
                    <circle r="14" fill="#6b7280" opacity="0.9" />
                    <text x="0" y="5" fontSize="10" fontWeight="bold" fill="white" textAnchor="middle">{ group.count }</text>
                    <text x="0" y="18" fontSize="9" fill="#374151" textAnchor="middle">{ group.count } rides</text>
                  </g>
                );
              }
              const ride = group.ride;
              const { x, y } = project(ride.position.lat, ride.position.lng, 1000, 700);
              const isSelected = ride.id === selectedRideId;
              const isHovered = ride.id === hoveredRideId;
              return (
                <g
                  key={ ride.id }
                  onClick={ () => onRideClick(ride.id) }
                  onMouseEnter={ () => onRideHover(ride.id) }
                  onMouseLeave={ () => onRideHover(null) }
                  style={ { cursor: "pointer" } }
                >
                  <path d="M12 2 C8.7 2 6 4.7 6 8 C6 11.3 12 16 12 16 C12 16 18 11.3 18 8 C18 4.7 15.3 2 12 2 Z" fill={ isSelected ? "#dc2626" : "#2563eb" } transform={ `translate(${x - 12},${y - 12}) rotate(${ride.position.heading},12,12)` } />
                  <circle cx={ x } cy={ y - 18 } r="6" fill="#16a34a" />
                  <circle cx={ x } cy={ y + 18 } r="5" fill="#dc2626" />
                </g>
              );
            }) }
          </svg>
        </div>
      ) }
      { !hasGoogleMaps && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
          <div className="pointer-events-auto rounded-lg border border-slate-300 bg-white/90 px-4 py-3 text-sm text-slate-700 shadow-md backdrop-blur">
            Google Maps not configured. Set <code className="font-mono text-xs">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable the live map.
          </div>
        </div>
      ) }
    </div>
  );
}
