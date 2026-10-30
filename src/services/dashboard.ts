import { API_ROUTES, PERIOD_DAYS } from '../lib/config'
import { apiGet } from './api'
import { formatCount, formatMoney, mapDriver, mapRide } from './mappers'
import type {
  AnalyticsDrivers,
  AnalyticsOverview,
  AnalyticsPeakHourRow,
  AnalyticsPeriod,
  AnalyticsRevenueRow,
  AnalyticsRidesRow,
  AnalyticsSeries,
  DashboardStat,
  DriverStats,
  PeakHourPoint,
  RevenuePoint,
  RidesPoint,
} from '../types/index'

const FLEET_PAGE_SIZE = 100

// `apiGet` already unwraps the `{ data }` envelope, but some endpoints nest it
// once more or return `{ items }`. Unwrap defensively so the mapping below only
// ever sees the payload itself.
const unwrap = (payload: any): any => {
  let value = payload
  let guard = 0

  while (value && typeof value === 'object' && !Array.isArray(value) && 'data' in value && guard < 3) {
    value = value.data
    guard += 1
  }

  return value
}

const asObject = (payload: any): Record<string, any> => {
  const value = unwrap(payload)

  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

const AGGREGATE_KEYS = [
  'period_start',
  'total_rides',
  'total_revenue_tzs',
  'hour_of_day',
  'ride_count',
  'total_users',
  'total_drivers',
]

const asRows = (payload: any): any[] => {
  const value = unwrap(payload)

  if (Array.isArray(value)) return value
  if (Array.isArray(value?.items)) return value.items
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.data?.items)) return value.data.items

  if (value && typeof value === 'object' && AGGREGATE_KEYS.some((key) => key in value)) {
    return [value]
  }

  return []
}

const getValue = (obj: any, keys: string[]) => {
  if (!obj || typeof obj !== 'object') return undefined

  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key]
  }

  return undefined
}

const toNumber = (value: any) => {
  const num = Number(value)

  return Number.isFinite(num) ? num : 0
}

const dateValue = (row: any) => {
  const raw = row?.period_start ?? row?.date ?? row?.day

  if (!raw) return null

  const date = new Date(raw)

  return Number.isNaN(date.getTime()) ? null : date
}

const formatPeriodLabel = (row: any) => {
  const date = dateValue(row)

  if (!date) return String(row?.period_start ?? row?.date ?? row?.day ?? 'Current period')

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

const sortByPeriod = (rows: any[]) =>
  rows
    .map((row) => ({ row, date: dateValue(row) }))
    .sort((a, b) => {
      if (!a.date) return 1
      if (!b.date) return -1
      return a.date.getTime() - b.date.getTime()
    })
    .map((entry) => entry.row)

// The endpoints usually honour `period` server-side. If a backend ignores it we
// still narrow the returned series so the selected window matches the label.
const filterByPeriod = (rows: any[], period: AnalyticsPeriod) => {
  const sorted = sortByPeriod(rows)

  if (sorted.length <= 1) return sorted

  return sorted.slice(-PERIOD_DAYS[period])
}

const mapRidesRow = (row: AnalyticsRidesRow): RidesPoint => ({
  period: String(row.period_start ?? row.date ?? row.day ?? ''),
  label: formatPeriodLabel(row),
  total: toNumber(row.total_rides ?? row.rides),
  completed: toNumber(row.completed_rides ?? row.completed),
  cancelled: toNumber(row.cancelled_rides ?? row.cancelled),
  rejected: toNumber(row.rejected_rides ?? row.rejected),
  fare: toNumber(row.total_fare_tzs ?? row.total_fare),
  platformFee: toNumber(row.total_platform_fee_tzs ?? row.platform_fee_tzs ?? row.platform_fee),
  avgFare: toNumber(row.avg_fare_tzs ?? row.avg_fare),
  avgDistance: toNumber(row.avg_distance_m ?? row.avg_distance),
})

const mapRevenueRow = (row: AnalyticsRevenueRow): RevenuePoint => ({
  period: String(row.period_start ?? row.date ?? row.day ?? ''),
  label: formatPeriodLabel(row),
  totalRevenue: toNumber(row.total_revenue_tzs ?? row.total_revenue ?? row.revenue ?? row.amount),
  platformFees: toNumber(row.platform_fees_tzs ?? row.platform_fees),
  driverEarnings: toNumber(row.driver_earnings_tzs ?? row.driver_earnings),
  payouts: toNumber(row.payouts_tzs ?? row.payouts),
  transactions: toNumber(row.transaction_count ?? row.transactions),
})

const mapPeakHours = (rows: AnalyticsPeakHourRow[]): PeakHourPoint[] => {
  const grouped = new Map<number, { rides: number; fareTotal: number; revenue: number }>()

  rows.forEach((row) => {
    const hour = toNumber(row.hour_of_day ?? row.hour ?? row.period ?? row.time)
    const rides = toNumber(row.ride_count ?? row.total_rides ?? row.rides ?? row.count)
    const avgFare = toNumber(row.avg_fare_tzs ?? row.avg_fare)
    const revenue = toNumber(row.total_revenue_tzs ?? row.total_revenue)
    const current = grouped.get(hour) ?? { rides: 0, fareTotal: 0, revenue: 0 }

    grouped.set(hour, {
      rides: current.rides + rides,
      fareTotal: current.fareTotal + avgFare * rides,
      revenue: current.revenue + revenue,
    })
  })

  return Array.from(grouped.entries())
    .map(([hour, value]) => ({
      hour,
      label: `${String(hour).padStart(2, '0')}:00`,
      rides: value.rides,
      avgFare: value.rides ? Math.round(value.fareTotal / value.rides) : 0,
      revenue: value.revenue,
    }))
    .sort((a, b) => a.hour - b.hour)
}

const mapDrivers = (payload: any): DriverStats => {
  const data = asObject(payload) as AnalyticsDrivers

  return {
    totalDrivers: toNumber(getValue(data, ['total_drivers', 'drivers'])),
    verified: toNumber(getValue(data, ['verified', 'verified_drivers'])),
    pending: toNumber(getValue(data, ['pending', 'pending_drivers'])),
    rejected: toNumber(data.rejected),
    suspended: toNumber(getValue(data, ['suspended', 'suspended_drivers'])),
    registeredThisWeek: toNumber(data.registered_this_week),
    verifiedThisWeek: toNumber(data.verified_this_week),
    pendingDocuments: toNumber(data.pending_documents),
    completeDocs: toNumber(data.drivers_with_complete_docs),
    activeToday: toNumber(data.active_drivers_today),
    activeRoutes: toNumber(data.drivers_with_active_routes),
  }
}

const toSeries = <T>(rows: any[], mapper: (row: any) => T): AnalyticsSeries<T> => {
  const points = rows.map(mapper)

  return {
    isSeries: points.length > 1,
    points,
    latest: points.length ? points[points.length - 1] : null,
  }
}

export async function getDashboard(period: AnalyticsPeriod = 'month') {
  const results = await Promise.allSettled([
    apiGet(API_ROUTES.users, { params: { page: 1, page_size: 1, is_driver: false } }),
    apiGet(API_ROUTES.drivers, {
      params: { page: 1, page_size: FLEET_PAGE_SIZE, sort_by: 'total_rides', sort_order: 'desc' },
    }),
    apiGet(API_ROUTES.analyticsOverview, { params: { period } }),
    apiGet(API_ROUTES.analyticsRides, { params: { period } }),
    apiGet(API_ROUTES.analyticsRevenue, { params: { period } }),
    apiGet(API_ROUTES.analyticsDrivers, { params: { period } }),
    apiGet(API_ROUTES.analyticsPeakHours, { params: { days_back: PERIOD_DAYS[period] } }),
    apiGet(API_ROUTES.rides, { params: { page: 1, page_size: 5, sort_by: 'created_at', sort_order: 'desc' } }),
  ])

  const [customersRes, fleetRes, overviewRes, rideStatsRes, revenueRes, driversAnalyticsRes, peakHoursRes, recentRes] = results

  const customers = customersRes.status === 'fulfilled' ? customersRes.value : null
  const fleet = fleetRes.status === 'fulfilled' ? fleetRes.value : null
  const overviewRaw = overviewRes.status === 'fulfilled' ? overviewRes.value : null
  const rideStats = rideStatsRes.status === 'fulfilled' ? rideStatsRes.value : null
  const revenue = revenueRes.status === 'fulfilled' ? revenueRes.value : null
  const driversAnalytics = driversAnalyticsRes.status === 'fulfilled' ? driversAnalyticsRes.value : null
  const peakHours = peakHoursRes.status === 'fulfilled' ? peakHoursRes.value : null
  const recent = recentRes.status === 'fulfilled' ? recentRes.value : null

  const overview = asObject(overviewRaw) as AnalyticsOverview

  const drivers = (fleet?.items ?? []).map(mapDriver)
  const verifiedDriversFromFleet = drivers.filter((driver) => driver.statusKey === 'verified').length
  const pendingDriversFromFleet = drivers.filter((driver) => driver.statusKey === 'pending').length

  const customerTotal =
    toNumber(getValue(overview, ['total_users', 'total_customers', 'customers'])) ||
    toNumber(customers?.pagination?.total_items) ||
    0

  const driverTotal =
    toNumber(getValue(overview, ['total_drivers', 'drivers'])) ||
    toNumber(fleet?.pagination?.total_items) ||
    drivers.length

  const verifiedDrivers =
    toNumber(getValue(overview, ['verified_drivers', 'verified'])) || verifiedDriversFromFleet

  const pendingDrivers =
    toNumber(getValue(overview, ['pending_drivers', 'pending'])) || pendingDriversFromFleet

  const ridesToday = toNumber(getValue(overview, ['rides_today', 'total_rides_today']))
  const ridesThisWeek = toNumber(getValue(overview, ['rides_this_week']))
  const ridesThisMonth = toNumber(getValue(overview, ['rides_this_month']))
  const revenueToday = toNumber(getValue(overview, ['revenue_today_tzs', 'total_revenue_today', 'revenue_today']))
  const revenueThisWeek = toNumber(getValue(overview, ['revenue_this_week_tzs']))
  const revenueThisMonth = toNumber(getValue(overview, ['revenue_this_month_tzs']))

  const ridesRows = filterByPeriod(asRows(rideStats), period)
  const revenueRows = filterByPeriod(asRows(revenue), period)
  const driverStats = mapDrivers(driversAnalytics)
  const peakHourPoints = mapPeakHours(asRows(peakHours) as AnalyticsPeakHourRow[])

  const stats: DashboardStat[] = [
    {
      label: 'Total Customers',
      value: formatCount(customerTotal),
      delta: `${formatCount(customerTotal)} registered`,
      up: true,
      hint: 'accounts without a driver profile',
    },
    {
      label: 'Active Drivers',
      value: formatCount(verifiedDrivers),
      delta: `${formatCount(pendingDrivers)} awaiting review`,
      up: true,
      hint: `of ${formatCount(driverTotal)} registered drivers`,
    },
    {
      label: 'Rides Today',
      value: formatCount(ridesToday),
      delta: `${formatCount(ridesThisWeek)} this week`,
      up: true,
      hint: `${formatCount(ridesThisMonth)} this month`,
    },
    {
      label: 'Revenue Today',
      value: formatMoney(revenueToday),
      delta: `${formatMoney(revenueThisWeek)} this week`,
      up: true,
      hint: `${formatMoney(revenueThisMonth)} this month`,
    },
  ]

  return {
    stats,
    overview,
    ridesAnalytics: toSeries<RidesPoint>(ridesRows, mapRidesRow),
    revenueAnalytics: toSeries<RevenuePoint>(revenueRows, mapRevenueRow),
    driversAnalytics: driverStats,
    peakHours: peakHourPoints,
    periodDays: PERIOD_DAYS[period],
    recentDeliveries: (recent?.items ?? []).map(mapRide),
    topDrivers: drivers.slice(0, 4).map((driver: any) => ({
      id: driver.id,
      name: driver.name,
      status: driver.status,
      rides: driver.rides,
      rating: driver.rating,
      active: driver.statusKey === 'verified',
    })),
    verifiedDrivers,
  }
}
