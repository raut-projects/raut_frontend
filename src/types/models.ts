/**
 * Presentation-friendly domain models for admin and onboarding UI. Backend
 * snake_case payloads are mapped to camelCase, keeping display strings next to
 * machine-readable keys where both are needed.
 */

/** Roles recognized by the admin application. */
export type UserRole = 'user' | 'admin' | 'super_admin'

/**
 * Customer/admin-user row used by the customers table.
 * `id` is null when the backend has no identifier yet. `status` and `role` are
 * display labels, while `statusKey` is the lowercase filter value. `joined`
 * and `createdAt` are formatted strings rather than Date objects.
 */
export interface Customer {
  id: string | number | null
  name: string
  email: string
  phone: string
  orders: number
  joined: string
  status: 'Active' | 'Inactive' | string
  statusKey: 'active' | 'inactive' | string
  role: UserRole | string
  isDriver: boolean
  isActive: boolean
  createdAt: string | null
}

/**
 * Driver row used by the drivers table.
 * `rides` is the lifetime ride count, `rating` the average score, and
 * `ratingCount` the number of ratings behind it. `status` is the display label
 * and `statusKey` the filter value.
 */
export interface Driver {
  id: string | number | null
  name: string
  phone: string
  email: string
  status: string
  statusKey: string
  rides: number
  rating: number
  ratingCount: number
  isActive: boolean
  joined: string
  verifiedAt: string
}

/**
 * Lightweight authenticated session shown in the admin shell.
 * `initials` feeds the avatar and `roleLabel` is the display name for the
 * backend `role`. `roleVerifiedAt` is an optional timestamp for when the role
 * was last confirmed.
 */
export interface AuthSession {
  id: string | number | null
  name: string
  phone: string
  role: string
  roleLabel: string
  initials: string
  signedInAt: string
  roleVerifiedAt?: number
}

/**
 * Raw authenticated user record from the backend (snake_case).
 * `permissions` lists granted permission keys; the index signature preserves
 * additional backend fields not modeled here.
 */
export interface AuthUser {
  id: string | number | null
  full_name?: string
  email?: string
  phone?: string
  role?: UserRole | string
  is_admin?: boolean
  is_super_admin?: boolean
  permissions?: string[]
  [key: string]: unknown
}
