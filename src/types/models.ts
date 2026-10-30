export type UserRole = 'user' | 'admin' | 'super_admin'

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
