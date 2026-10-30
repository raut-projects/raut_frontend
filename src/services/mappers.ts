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

const compactFormat = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

// Axis labels need short values so the chart plot area is not squeezed.
export const formatCompact = (value) => {
  const amount = Number(value)

  return Number.isFinite(amount) ? compactFormat.format(amount) : EMPTY
}

export const formatCompactMoney = (value) => {
  const amount = Number(value)

  if (!Number.isFinite(amount)) return EMPTY

  return `TZS ${compactFormat.format(amount)}`
}

const FILE_SIZE_UNITS = ['B', 'KB', 'MB', 'GB']

export const formatFileSize = (value) => {
  const bytes = Number(value)

  if (!Number.isFinite(bytes) || bytes <= 0) return EMPTY

  let size = bytes
  let unit = 0

  while (size >= 1024 && unit < FILE_SIZE_UNITS.length - 1) {
    size /= 1024
    unit += 1
  }

  const rounded = unit === 0 || size >= 10 ? Math.round(size) : Math.round(size * 10) / 10

  return `${rounded} ${FILE_SIZE_UNITS[unit]}`
}

export const formatDistance = (value) => {
  if (value === null || value === undefined || value === '') return EMPTY

  const meters = Number(value)

  if (!Number.isFinite(meters) || meters < 0) return EMPTY
  if (meters < 1000) return `${Math.round(meters)} m`

  return `${(meters / 1000).toFixed(1)} km`
}

export const formatDuration = (value) => {
  if (value === null || value === undefined || value === '') return EMPTY

  const seconds = Number(value)

  if (!Number.isFinite(seconds) || seconds < 0) return EMPTY
  if (seconds < 60) return `${Math.round(seconds)} sec`

  const totalMinutes = Math.round(seconds / 60)

  if (totalMinutes < 60) return `${totalMinutes} min`

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return minutes ? `${hours} hr ${minutes} min` : `${hours} hr`
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

export const ROUTE_STATUS_LABELS = {
  scheduled: 'Scheduled',
  active: 'Active',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  expired: 'Expired',
}

const ROUTE_CANCELLABLE_STATUSES = ['scheduled', 'active', 'in_progress']

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

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'heic', 'heif', 'avif']

const documentFormat = (contentType, fileName) => {
  const type = String(contentType ?? '').toLowerCase()
  const [mediaType, subtype = ''] = type.split('/')
  const extension = /\.([a-z0-9]+)$/i.exec(String(fileName ?? ''))?.[1]?.toLowerCase() ?? ''
  const isImage = mediaType === 'image' || IMAGE_EXTENSIONS.includes(extension)

  if (subtype) {
    return { isImage, formatLabel: subtype === 'svg+xml' ? 'SVG' : subtype.toUpperCase() }
  }

  return { isImage, formatLabel: extension ? extension.toUpperCase() : EMPTY }
}

export const mapDocument = (document) => {
  const statusKey = document?.status ?? 'pending'
  const typeKey = document?.doc_type ?? ''
  const { isImage, formatLabel } = documentFormat(document?.content_type, document?.file_name)

  return {
    id: document?.id ?? null,
    type: typeKey,
    typeLabel: DOCUMENT_TYPE_LABELS[typeKey] ?? (typeKey ? titleCase(typeKey) : EMPTY),
    status: DOCUMENT_STATUS_LABELS[statusKey] ?? titleCase(statusKey),
    statusKey,
    fileName: document?.file_name ?? EMPTY,
    fileUrl: document?.file_url ?? null,
    contentType: document?.content_type ?? null,
    fileSize: Number(document?.file_size) || 0,
    fileSizeLabel: formatFileSize(document?.file_size),
    fileFormatLabel: formatLabel,
    isImage,
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

export const PAYOUT_STATUS_LABELS = {
  pending: 'Pending',
  requested: 'Pending',
  scheduled: 'Scheduled',
  processing: 'Processing',
  approved: 'Approved',
  paid: 'Paid',
  completed: 'Paid',
  settled: 'Paid',
  transferred: 'Paid',
  success: 'Paid',
  failed: 'Failed',
  error: 'Failed',
  reversed: 'Reversed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
}

export const PAYOUT_METHOD_LABELS = {
  mobile_money: 'Mobile money',
  mpesa: 'M-Pesa',
  bank: 'Bank transfer',
  bank_transfer: 'Bank transfer',
  cash: 'Cash',
  card: 'Card',
}

// The status groups decide which actions the table offers.
export const PAYOUT_AWAITING_STATUSES = ['pending', 'requested', 'approved', 'scheduled', 'processing']

export const PAYOUT_SETTLED_STATUSES = ['paid', 'completed', 'settled', 'transferred', 'success']

export const PAYOUT_FAILED_STATUSES = ['failed', 'error', 'reversed']

export const PAYOUT_APPROVABLE_STATUSES = ['pending', 'requested', 'approved', 'scheduled']

// The payout endpoints have no declared response model, so every field is read
// through a list of candidates and the first match wins. The API is free to
// name a field differently than expected without breaking the screen.
const firstOf = (source, keys, fallback = null) => {
  if (!source || typeof source !== 'object') return fallback

  for (const key of keys) {
    const value = source[key]

    if (value !== undefined && value !== null && value !== '') return value
  }

  return fallback
}

export const mapPayout = (payout) => {
  const statusKey = String(firstOf(payout, ['status', 'payout_status'], 'pending')).toLowerCase()
  const methodKey = String(firstOf(payout, ['method', 'payout_method', 'payment_method', 'channel'], '')).toLowerCase()
  const driver = payout?.driver ?? null

  const rawAmount = firstOf(payout, ['amount', 'payout_amount', 'total_amount', 'net_amount', 'gross_amount'], 0)
  const amount = Number(rawAmount)

  const driverName = firstOf(payout, ['driver_name', 'driver_full_name']) ?? firstOf(driver, ['full_name', 'name'])

  return {
    id: firstOf(payout, ['id', 'payout_id']),
    driverId: firstOf(payout, ['driver_id']),
    driverName: driverName ?? EMPTY,
    driverPhone:
      firstOf(payout, ['driver_phone', 'driver_phone_number']) ?? firstOf(driver, ['phone', 'phone_number']) ?? EMPTY,
    amount: Number.isFinite(amount) ? amount : 0,
    amountLabel: formatMoney(rawAmount),
    methodKey,
    method: PAYOUT_METHOD_LABELS[methodKey] ?? (methodKey ? titleCase(methodKey) : EMPTY),
    methodDetails:
      firstOf(payout, ['phone_number', 'mobile_money_number', 'account_number', 'bank_account', 'destination_account']) ??
      EMPTY,
    statusKey,
    status: PAYOUT_STATUS_LABELS[statusKey] ?? titleCase(statusKey),
    reference:
      firstOf(payout, ['reference', 'transaction_reference', 'external_reference', 'payout_reference', 'transaction_id']) ??
      EMPTY,
    notes: firstOf(payout, ['notes', 'admin_notes', 'note']) ?? EMPTY,
    rejectionReason: firstOf(payout, ['rejection_reason', 'reason']) ?? EMPTY,
    requestedAt: formatDateTime(firstOf(payout, ['created_at', 'requested_at', 'initiated_at', 'requested_date'])),
    processedAt: formatDateTime(
      firstOf(payout, ['processed_at', 'approved_at', 'paid_at', 'completed_at', 'paid_date']),
    ),
    periodStart: formatDate(firstOf(payout, ['period_start', 'period_start_date', 'start_date', 'from_date'])),
    periodEnd: formatDate(firstOf(payout, ['period_end', 'period_end_date', 'end_date', 'to_date'])),
    isAwaiting: PAYOUT_AWAITING_STATUSES.includes(statusKey),
    isSettled: PAYOUT_SETTLED_STATUSES.includes(statusKey),
    isFailed: PAYOUT_FAILED_STATUSES.includes(statusKey),
    canApprove: PAYOUT_APPROVABLE_STATUSES.includes(statusKey),
    canRetry: PAYOUT_FAILED_STATUSES.includes(statusKey),
  }
}

export const mapRide = (ride) => {
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
    pickup,
    dropoff,
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
    requestedAt: formatDateTime(ride?.created_at),
    createdAt: ride?.created_at ?? null,
  }
}

export const mapRoute = (route) => {
  const statusKey = String(route?.status ?? 'unknown').toLowerCase()
  const origin = route?.origin_name?.trim() || EMPTY
  const destination = route?.dest_name?.trim() || EMPTY
  const routePath =
    origin === EMPTY || destination === EMPTY
      ? origin || destination
      : `${origin} \u2192 ${destination}`

  return {
    id: shortId(route?.id, 'RTE'),
    routeId: route?.id ?? null,
    driverId: route?.driver_id ?? null,
    vehicleId: route?.vehicle_id ?? null,
    driver: route?.driver_name?.trim() || 'Unassigned',
    driverPhone: route?.driver_phone ?? EMPTY,
    vehicle: route?.vehicle_info?.trim() || EMPTY,
    plateNumber: route?.plate_number ?? EMPTY,
    origin,
    destination,
    route: routePath,
    originLat: Number(route?.origin_lat),
    originLng: Number(route?.origin_lng),
    destLat: Number(route?.dest_lat),
    destLng: Number(route?.dest_lng),
    distanceM: Number(route?.route_distance_m ?? 0),
    distance: formatDistance(route?.route_distance_m),
    durationS: Number(route?.route_duration_s ?? 0),
    duration: formatDuration(route?.route_duration_s),
    seats: Number(route?.available_seats ?? 0),
    status: ROUTE_STATUS_LABELS[statusKey] ?? titleCase(statusKey),
    statusKey,
    scheduledFor: route?.scheduled_for ? formatDateTime(route.scheduled_for) : 'Not scheduled',
    startedAt: route?.started_at ? formatDateTime(route.started_at) : 'Not started',
    completedAt: route?.completed_at ? formatDateTime(route.completed_at) : 'Not completed',
    createdAt: formatDateTime(route?.created_at),
    created: formatDate(route?.created_at),
    activeRides: Number(route?.active_rides_count ?? 0),
    totalRides: Number(route?.total_rides_count ?? 0),
    canCancel: ROUTE_CANCELLABLE_STATUSES.includes(statusKey),
  }
}

export const TRANSACTION_STATUS_LABELS = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  successful: 'Completed',
  paid: 'Completed',
  settled: 'Completed',
  success: 'Completed',
  failed: 'Failed',
  error: 'Failed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  reversed: 'Reversed',
}

export const TRANSACTION_TYPE_LABELS = {
  payment: 'Payment',
  ride_payment: 'Ride Payment',
  ride_earning: 'Ride Earning',
  fare: 'Fare',
  payout: 'Payout',
  withdrawal: 'Withdrawal',
  refund: 'Refund',
  commission: 'Commission',
  fee: 'Fee',
  top_up: 'Top Up',
  deposit: 'Deposit',
}

const TRANSACTION_AWAITING_STATUSES = ['pending', 'processing']
const TRANSACTION_COMPLETED_STATUSES = ['completed', 'successful', 'paid', 'settled', 'success']
const TRANSACTION_FAILED_STATUSES = ['failed', 'error', 'cancelled', 'reversed']

export const mapTransaction = (transaction) => {
  const statusKey = String(transaction?.status ?? 'pending').toLowerCase()
  const typeKey = String(transaction?.type ?? '').toLowerCase()
  const rawAmount = transaction?.amount ?? 0
  const amount = Number(rawAmount)
  return {
    id: transaction?.id ?? null,
    reference: transaction?.external_ref ?? transaction?.id ?? EMPTY,
    userId: transaction?.user_id ?? null,
    userName: transaction?.user_name?.trim() || EMPTY,
    userPhone: transaction?.user_phone ?? EMPTY,
    typeKey,
    type: TRANSACTION_TYPE_LABELS[typeKey] ?? (typeKey ? titleCase(typeKey) : EMPTY),
    amount: Number.isFinite(amount) ? amount : 0,
    amountLabel: formatMoney(rawAmount),
    currency: 'TZS',
    statusKey,
    status: TRANSACTION_STATUS_LABELS[statusKey] ?? titleCase(statusKey),
    description: EMPTY,
    paymentMethod: EMPTY,
    rideId: transaction?.ride_id ?? null,
    routeId: null,
    payoutId: transaction?.payout_id ?? null,
    createdAt: formatDateTime(transaction?.created_at),
    updatedAt: formatDateTime(transaction?.completed_at),
    created: formatDate(transaction?.created_at),
    completedAt: formatDateTime(transaction?.completed_at),
    externalRef: transaction?.external_ref ?? null,
    isPending: TRANSACTION_AWAITING_STATUSES.includes(statusKey),
    isCompleted: TRANSACTION_COMPLETED_STATUSES.includes(statusKey),
    isFailed: TRANSACTION_FAILED_STATUSES.includes(statusKey),
  }
}

export const mapNotification = (notification) => ({
  id: notification?.id,
  type: NOTIFICATION_TYPES[notification?.type] ?? 'info',
  title: notification?.title ?? 'Update',
  message: notification?.body ?? '',
  time: formatRelative(notification?.created_at),
  read: Boolean(notification?.is_read),
  to: notification?.ride_id ? '/rides' : notification?.route_id ? '/routes' : null,
})
