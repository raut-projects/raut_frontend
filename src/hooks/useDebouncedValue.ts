/**
 * Generic debouncing utility for search and filter inputs.
 * Delays propagating a rapidly changing value so downstream queries or filters
 * only run after the user pauses. Collaborates with React state and timers.
 */
import { useEffect, useState } from "react";

/**
 * Returns a copy of `value` that updates only after `delay` milliseconds pass
 * without another change.
 *
 * Each change clears the pending timer, so intermediate keystrokes never reach
 * consumers. The timer is also cleared on unmount to avoid setting state after
 * the component is gone.
 *
 * @param value - Value to debounce, commonly a search string.
 * @param delay - Quiet period in milliseconds; defaults to 300.
 * @returns The most recently settled value.
 */
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
