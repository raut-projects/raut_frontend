// The admin API returns raw domain values (numbers, ISO timestamps, enums).
// Everything the screens display is formatted here so the pages stay free of
// data shaping.

export const EMPTY = '—'

const numberFormat = new Intl.NumberFormat('en-US')

export const formatCount = (value) => {
  const amount = Number(value)

  return Number.isFinite(amount) ? numberFormat.format(amount) : EMPTY
}

export const formatMoney = (value) => {
  const amount = Number(value)

  if (!Number.isFinite(amount)) return EMPTY

  return `TZS ${numberFormat.format(amount)}`
}

export const formatDate = (value) => {
  if (!value) return EMPTY

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return EMPTY

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export const formatDateTime = (value) => {
  if (!value) return EMPTY

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return EMPTY

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  })
}

export const formatRelative = (value) => {
  if (!value) return EMPTY

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return EMPTY

  const seconds = Math.round((Date.now() - date.getTime()) / 1000)

  if (seconds < 60) return 'Just now'

  const minutes = Math.round(seconds / 60)

  if (minutes < 60) return `${minutes} min ago`

  const hours = Math.round(minutes / 60)

  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`

  const days = Math.round(hours / 24)

  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`

  return formatDate(value)
}

// Percentage change between two periods, ready for the stat cards.
export const formatDelta = (current, previous) => {
  const now = Number(current) || 0
  const before = Number(previous) || 0

  if (!before) return now ? 'New activity' : 'No change'

  const change = ((now - before) / before) * 100

  return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`
}

export const shortId = (value, prefix = 'RID') => {
  const id = String(value ?? '').replace(/-/g, '')

  if (!id) return EMPTY

  return `#${prefix}-${id.slice(0, 8).toUpperCase()}`
}

export const DRIVER_STATUS_LABELS = {
  none: 'Not a driver',
  incomplete: 'Incomplete',
  pending: 'Pending',
  verified: 'Verified',
  rejected: 'Rejected',
  suspended: 'Suspended',
}

export const DOCUMENT_TYPE_LABELS = {
  license: 'Driving licence',
  registration: 'Vehicle registration',
  inspection: 'Inspection certificate',
  insurance: 'Insurance',
  profile_photo: 'Profile photo',
  certificate_of_authorization: 'Certificate of authorization',
  sticker_photo: 'Sticker photo',
  vehicle_photo: 'Vehicle photo',
}

export const DOCUMENT_STATUS_LABELS = {
  pending: 'Pending review',
  approved: 'Approved',
  verified: 'Approved',
  rejected: 'Rejected',
  expired: 'Expired',
}

// The backend marks a reviewed document as approved, but a verified spelling
// is accepted as well so an unexpected value still reads correctly.
const APPROVED_DOCUMENT_STATUSES = ['approved', 'verified']

export const RIDE_STATUS_LABELS = {
  requested: 'Pending',
  searching: 'Pending',
  joined: 'In transit',
  accepted: 'In transit',
  picked_up: 'In transit',
  in_progress: 'In transit',
  completed: 'Delivered',
  cancelled: 'Cancelled',
  rejected: 'Cancelled',
  expired: 'Cancelled',
}

const NOTIFICATION_TYPES = {
  ride_completed: 'success',
  ride_cancelled: 'error',
  payment_received: 'success',
  payment_failed: 'error',
  driver_approved: 'success',
  driver_rejected: 'error',
  document_expiring: 'warning',
  new_ride: 'info',
  account_update: 'info',
}

const titleCase = (value) =>
  String(value ?? '')
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ')

export const mapCustomer = (user) => ({
  id: user?.id ?? null,
  name: user?.full_name?.trim() || user?.email?.trim() || 'Unnamed account',
  email: user?.email ?? EMPTY,
  phone: user?.phone ?? EMPTY,
  orders: Number(user?.total_rides ?? 0),
  joined: formatDate(user?.created_at),
  status: user?.is_active === false ? 'Inactive' : 'Active',
  statusKey: user?.is_active === false ? 'inactive' : 'active',
  role: user?.role ?? 'user',
  isDriver: Boolean(user?.is_driver),
  isActive: user?.is_active !== false,
  createdAt: user?.created_at ?? null,
})

export const mapDriver = (driver) => {
  const statusKey = driver?.driver_status ?? 'none'

  return {
    id: driver?.id ?? null,
    name: driver?.full_name?.trim() || driver?.email?.trim() || 'Unnamed driver',
    phone: driver?.phone ?? EMPTY,
    email: driver?.email ?? EMPTY,
    status: DRIVER_STATUS_LABELS[statusKey] ?? titleCase(statusKey),
    statusKey,
    rides: Number(driver?.total_rides ?? 0),
    rating: Number(driver?.rating_avg ?? 0) || 0,
    ratingCount: Number(driver?.rating_count ?? 0),
    isActive: driver?.is_active !== false,
    joined: formatDate(driver?.created_at),
    verifiedAt: formatDate(driver?.driver_verified_at),
  }
}

export const mapDocument = (document) => {
  const statusKey = document?.status ?? 'pending'
  const typeKey = document?.doc_type ?? ''

  return {
    id: document?.id ?? null,
    type: typeKey,
    typeLabel: DOCUMENT_TYPE_LABELS[typeKey] ?? (typeKey ? titleCase(typeKey) : EMPTY),
    status: DOCUMENT_STATUS_LABELS[statusKey] ?? titleCase(statusKey),
    statusKey,
    fileName: document?.file_name ?? EMPTY,
    fileUrl: document?.file_url ?? null,
    vehicleId: document?.vehicle_id ?? null,
    expiresAt: document?.expires_at ?? null,
    expiry: document?.expires_at ? formatDate(document.expires_at) : 'No expiry',
    uploadedAt: formatDate(document?.created_at),
    reviewedAt: document?.reviewed_at ? formatDate(document.reviewed_at) : null,
    rejectionReason: document?.rejection_reason ?? null,
    isApproved: APPROVED_DOCUMENT_STATUSES.includes(statusKey),
    isRejected: statusKey === 'rejected',
  }
}

export const mapDelivery = (ride) => {
  const statusKey = ride?.status ?? 'requested'
  const pickup = ride?.pickup_name?.trim() || ride?.route_origin?.trim() || EMPTY
  const dropoff = ride?.dropoff_name?.trim() || ride?.route_destination?.trim() || EMPTY

  return {
    id: shortId(ride?.id),
    rideId: ride?.id ?? null,
    customer: ride?.rider_name?.trim() || 'Unknown customer',
    customerPhone: ride?.rider_phone ?? EMPTY,
    driver: ride?.driver_name?.trim() || 'Unassigned',
    driverPhone: ride?.driver_phone ?? EMPTY,
    zone: ride?.route_origin?.trim() || ride?.pickup_name?.trim() || EMPTY,
    route: pickup === EMPTY || dropoff === EMPTY ? pickup : `${pickup} → ${dropoff}`,
    amount: formatMoney(ride?.fare_amount),
    fare: Number(ride?.fare_amount ?? 0),
    platformFee: formatMoney(ride?.platform_fee),
    driverEarning: formatMoney(ride?.driver_earning),
    seats: Number(ride?.seats_requested ?? 0),
    status: RIDE_STATUS_LABELS[statusKey] ?? titleCase(statusKey),
    statusKey,
    date: formatDate(ride?.created_at),
    createdAt: ride?.created_at ?? null,
  }
}

export const mapNotification = (notification) => ({
  id: notification?.id,
  type: NOTIFICATION_TYPES[notification?.type] ?? 'info',
  title: notification?.title ?? 'Update',
  message: notification?.body ?? '',
  time: formatRelative(notification?.created_at),
  read: Boolean(notification?.is_read),
  to: notification?.ride_id ? '/' : notification?.route_id ? '/drivers' : null,
})
