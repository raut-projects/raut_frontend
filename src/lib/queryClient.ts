// Application-wide TanStack Query client. Centralizes cache defaults (staleness,
// garbage collection, retry and refetch behaviour) so every query and mutation
// inherits the same settings. Consumed by the root providers and any non-React
// data access.

import { QueryClient } from "@tanstack/react-query";

// Shared TanStack Query client for the app. Centralizes cache defaults so every
// query and mutation inherits the same staleness, garbage-collection and retry
// behaviour. Consumed by the root providers and any non-React data access.

/**
 * Application-wide TanStack QueryClient.
 *
 * Queries: data stays fresh for 30s (staleTime), inactive entries are collected
 * after 5 minutes (gcTime), a failed query retries once, and queries refetch
 * when the window regains focus or the connection is restored.
 *
 * Mutations: never retried automatically (retry 0).
 */
const retryDelay = (attempt: number) => Math.min(1_000 * 2 ** attempt, 30_000);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      retryDelay,
      networkMode: "online",
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
      networkMode: "online",
    },
  },
});

// Polled lists already refresh on an interval, so a focus-driven refetch would
// only duplicate the request that resumes when the tab becomes visible again.
export const polledQueryOptions = {
  refetchOnWindowFocus: false,
} as const;
