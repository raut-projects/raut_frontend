/**
 * Virtualized/windowed list helper for large arrays.
 * Tracks viewport height via ResizeObserver and slices visible items.
 */
import { useRef, useState, useEffect, useMemo, useCallback } from "react";

/**
 * useWindowedList — renders only the visible slice of a large list.
 *
 * Tracks the container's height with a ResizeObserver, computes the visible
 * index range from scrollTop and itemHeight (with overscan), and returns the
 * sliced items plus an offsetY for the spacer. Returns the full list when the
 * viewport height is unknown yet (initial render).
 *
 * @param items     full source array
 * @param itemHeight row height in px (default 168)
 * @param overscan  extra rows rendered above/below the viewport (default 6)
 * @returns containerRef, visible slice, range indices, offsetY, totalHeight,
 *          itemHeight and an onScroll handler to attach to the container.
 */
export function useWindowedList<T>({
  items,
  itemHeight = 168,
  overscan = 6,
}: {
  items: T[];
  itemHeight?: number;
  overscan?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewportHeight(entry.contentRect.height);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const totalHeight = items.length * itemHeight;
  const startIndex = useMemo(() => {
    if (viewportHeight === 0) return 0;
    return Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  }, [scrollTop, viewportHeight, itemHeight, overscan]);

  const endIndex = useMemo(() => {
    if (viewportHeight === 0) return items.length;
    return Math.min(
      items.length,
      Math.ceil((scrollTop + viewportHeight) / itemHeight) + overscan,
    );
  }, [scrollTop, viewportHeight, items.length, itemHeight, overscan]);

  const visible = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex],
  );
  const offsetY = startIndex * itemHeight;

  const onScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    containerRef,
    visible,
    startIndex,
    endIndex,
    offsetY,
    totalHeight,
    itemHeight,
    onScroll,
  };
}
