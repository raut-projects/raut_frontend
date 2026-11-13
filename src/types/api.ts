/**
 * Generic API envelope types shared by REST clients and React Query hooks.
 * Payloads stay loosely typed so callers can narrow per endpoint.
 */

/** Offset pagination metadata returned by list endpoints. */
export interface ApiPagination {
  page?: number
  page_size?: number
  total_pages?: number
  total_items?: number
}

/** Standard list response wrapper; `items` may be absent on empty payloads. */
export interface ApiListResponse<T> {
  items?: T[]
  pagination?: ApiPagination
  [key: string]: unknown
}

/** Minimal error body; additional backend fields pass through the index signature. */
export interface ApiError {
  message?: string
  [key: string]: unknown
}
