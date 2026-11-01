'use client'

import { useState } from 'react'

const toInternalPath = (value: string | null, fallback: string) => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback
  if (value === '/login') return fallback

  return value
}

// Reads the `from` query parameter used to send a user back to the page they
// originally asked for. Reading it from `window` (instead of
// `useSearchParams`) keeps static export from requiring a Suspense boundary.
export function useFromParam(fallback = '/') {
  const [from] = useState(() => {
    if (typeof window === 'undefined') return fallback

    return toInternalPath(new URLSearchParams(window.location.search).get('from'), fallback)
  })

  return from
}
