// Dashboard aggregation service.
// Fetches the overview, analytics, fleet and recent-ride endpoints in parallel,
// tolerates partial failures, and shapes the results into the DTOs the dashboard
// consumes. Formatting lives here so the page stays presentational.

import { API_ROUTES } from '../lib/config'
import { addDays, computeDelta, diffDays, getComparisonWindow } from '../lib/dateRange'
import { apiGet } from './api'
import { formatCount, formatMoney, mapDriver, mapRide } from './mappers'
import type {
  AnalyticsComparison,
  AnalyticsDrivers,
  AnalyticsOverview,
  AnalyticsPeakHourRow,
  AnalyticsRange,
  AnalyticsRevenueRow,
  AnalyticsRidesRow,
  AnalyticsSeries,
  DashboardStat,
  DriverStats,
  MetricDelta,
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

// The endpoints usually honour `period` and `days_back` server-side. The extra
// date filter keeps custom ranges honest and tolerates partial week/month buckets.
const filterRowsByRange = (rows: any[], range: AnalyticsRange) => {
  const sorted = sortByPeriod(rows)
  if (sorted.length <= 1) return sorted

  const tolerance = range.granularity === 'month' ? 30 : range.granularity === 'week' ? 6 : 0
  const start = addDays(range.start, -tolerance)
  const end = range.end

  return sorted.filter((row) => {
    const date = dateValue(row)
    if (!date) return true
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
    if (d < start) return false
    if (d > end) return false
    return true
  })
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

/**
 * Loads and shapes the complete dashboard payload.
 * Issues eight GETs in parallel (users count, driver fleet page, analytics
 * overview/rides/revenue/drivers/peak-hours, recent rides) and uses
 * `Promise.allSettled`, so a failing endpoint degrades that section instead of
 * failing the whole dashboard.
 *
 * @param range Selected analytics window; its granularity drives the period
 * params and its dates filter the bucketed rows locally.
 * @param compare When true and the window supports it, also fetches enough
 * history to build deltas against the previous equivalent period.
 * @returns Stats cards, overview, current/previous series, comparison deltas,
 * driver and peak-hour analytics, recent rides and top drivers.
 * Throws only if the shaping code itself fails; individual ApiErrors from
 * `apiGet` are swallowed into null sections.
 */
export async function getDashboard(range: AnalyticsRange, compare = false) {
  const comparisonWindow = getComparisonWindow(range)
  const comparisonActive = compare && comparisonWindow.enabled
  const fetchDays = comparisonActive ? comparisonWindow.fetchDays : range.daysBack
  const comparisonUnavailableReason =
    compare && !comparisonWindow.enabled ? comparisonWindow.reason : null

  const results = await Promise.allSettled([
    apiGet(API_ROUTES.users, { params: { page: 1, page_size: 1, is_driver: false } }),
    apiGet(API_ROUTES.drivers, {
      params: { page: 1, page_size: FLEET_PAGE_SIZE, sort_by: 'total_rides', sort_order: 'desc' },
    }),
    apiGet(API_ROUTES.analyticsOverview, { params: { period: range.granularity } }),
    apiGet(API_ROUTES.analyticsRides, {
      params: { period: range.granularity, days_back: fetchDays },
    }),
    apiGet(API_ROUTES.analyticsRevenue, {
      params: { period: range.granularity, days_back: fetchDays },
    }),
    apiGet(API_ROUTES.analyticsDrivers, { params: { period: range.granularity } }),
    apiGet(API_ROUTES.analyticsPeakHours, { params: { days_back: range.daysBack } }),
    apiGet(API_ROUTES.rides, { params: { page: 1, page_size: 5, sort_by: 'created_at', sort_order: 'desc' } }),
  ])

  // Each result is read independently: a rejected request becomes null and the
  // affected section falls back to zeros or fleet-derived values below.
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

  const allRideRows = asRows(rideStats)
  const allRevenueRows = asRows(revenue)
  const ridesRows = filterRowsByRange(allRideRows, range)
  const revenueRows = filterRowsByRange(allRevenueRows, range)
  const driverStats = mapDrivers(driversAnalytics)
  const peakHourPoints = mapPeakHours(asRows(peakHours) as AnalyticsPeakHourRow[])

  const ridesAnalytics = toSeries<RidesPoint>(ridesRows, mapRidesRow)
  const revenueAnalytics = toSeries<RevenuePoint>(revenueRows, mapRevenueRow)

  let previousRidesAnalytics: AnalyticsSeries<RidesPoint> | null = null
  let previousRevenueAnalytics: AnalyticsSeries<RevenuePoint> | null = null
  let comparison: AnalyticsComparison | null = null

  if (comparisonActive) {
    const previousRange: AnalyticsRange = {
      ...range,
      start: comparisonWindow.previousStart,
      end: comparisonWindow.previousEnd,
      startStr: comparisonWindow.previousStartStr,
      endStr: comparisonWindow.previousEndStr,
      daysBack: diffDays(comparisonWindow.previousStart, comparisonWindow.previousEnd) + 1,
    }

    const previousRidesRows = filterRowsByRange(allRideRows, previousRange)
    const previousRevenueRows = filterRowsByRange(allRevenueRows, previousRange)

    previousRidesAnalytics = toSeries<RidesPoint>(previousRidesRows, mapRidesRow)
    previousRevenueAnalytics = toSeries<RevenuePoint>(previousRevenueRows, mapRevenueRow)

    const currentRides = ridesAnalytics.points
    const previousRides = previousRidesAnalytics.points
    const currentRevenue = revenueAnalytics.points
    const previousRevenue = previousRevenueAnalytics.points

    const total = (points: RidesPoint[], key: keyof RidesPoint): number =>
      points.reduce((sum, point) => sum + Number(point[key] ?? 0), 0)
    const totalRevenue = (points: RevenuePoint[], key: keyof RevenuePoint): number =>
      points.reduce((sum, point) => sum + Number(point[key] ?? 0), 0)
    const delta = (current: number, previous: number): MetricDelta => computeDelta(current, previous)

    comparison = {
      ...comparisonWindow,
      rides: {
        total: delta(total(currentRides, 'total'), total(previousRides, 'total')),
        completed: delta(total(currentRides, 'completed'), total(previousRides, 'completed')),
        cancelled: delta(total(currentRides, 'cancelled'), total(previousRides, 'cancelled')),
        fare: delta(total(currentRides, 'fare'), total(previousRides, 'fare')),
      },
      revenue: {
        totalRevenue: delta(
          totalRevenue(currentRevenue, 'totalRevenue'),
          totalRevenue(previousRevenue, 'totalRevenue'),
        ),
        platformFees: delta(
          totalRevenue(currentRevenue, 'platformFees'),
          totalRevenue(previousRevenue, 'platformFees'),
        ),
        driverEarnings: delta(
          totalRevenue(currentRevenue, 'driverEarnings'),
          totalRevenue(previousRevenue, 'driverEarnings'),
        ),
        transactions: delta(
          totalRevenue(currentRevenue, 'transactions'),
          totalRevenue(previousRevenue, 'transactions'),
        ),
      },
    }
  }

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
    ridesAnalytics,
    revenueAnalytics,
    previousRidesAnalytics,
    previousRevenueAnalytics,
    comparison,
    comparisonUnavailableReason,
    driversAnalytics: driverStats,
    peakHours: peakHourPoints,
    periodDays: range.daysBack,
    range,
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
