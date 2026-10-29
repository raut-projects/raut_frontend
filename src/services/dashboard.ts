import { API_ROUTES } from '../lib/config'
import { apiGet } from './api'
import { formatCount, formatDelta, formatMoney, mapDriver, mapRide } from './mappers'

const FLEET_PAGE_SIZE = 100

const asList = (payload: any) => (Array.isArray(payload) ? payload : (payload?.items ?? payload?.data?.items ?? payload?.data ?? []))

const getValue = (obj: any, keys: string[]) => {
  if (!obj || typeof obj !== 'object') return undefined
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key]
  }
  return undefined
}

const toNumber = (value: any) => {
  const num = Number(value)
  return Number.isNaN(num) ? 0 : num
}

const dayKey = (value: any) => {
  if (!value) return null

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return null

  return date.toISOString().slice(0, 10)
}

const shiftDay = (offset: number) => {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + offset)

  return date.toISOString().slice(0, 10)
}

export async function getDashboard() {
  const results = await Promise.allSettled([
    apiGet(API_ROUTES.users, { params: { page: 1, page_size: 1, is_driver: false } }),
    apiGet(API_ROUTES.drivers, {
      params: { page: 1, page_size: FLEET_PAGE_SIZE, sort_by: 'total_rides', sort_order: 'desc' },
    }),
    apiGet(API_ROUTES.analyticsOverview),
    apiGet(API_ROUTES.analyticsRides),
    apiGet(API_ROUTES.analyticsRevenue),
    apiGet(API_ROUTES.analyticsDrivers),
    apiGet(API_ROUTES.analyticsPeakHours),
    apiGet(API_ROUTES.rides, { params: { page: 1, page_size: 5, sort_by: 'created_at', sort_order: 'desc' } }),
  ])

  const [customersRes, fleetRes, overviewRes, rideStatsRes, revenueRes, driversAnalyticsRes, peakHoursRes, recentRes] = results

  const customers = customersRes.status === 'fulfilled' ? customersRes.value : null
  const fleet = fleetRes.status === 'fulfilled' ? fleetRes.value : null
  const overview = overviewRes.status === 'fulfilled' ? overviewRes.value : null
  const rideStats = rideStatsRes.status === 'fulfilled' ? rideStatsRes.value : null
  const revenue = revenueRes.status === 'fulfilled' ? revenueRes.value : null
  const driversAnalytics = driversAnalyticsRes.status === 'fulfilled' ? driversAnalyticsRes.value : null
  const peakHours = peakHoursRes.status === 'fulfilled' ? peakHoursRes.value : null
  const recent = recentRes.status === 'fulfilled' ? recentRes.value : null

  const overviewData = overview && typeof overview === 'object' && 'data' in overview ? (overview as any).data : overview

  const customerTotal =
    toNumber(getValue(overviewData, ['total_customers', 'customers', 'total_users'])) ||
    toNumber(customers?.pagination?.total_items) ||
    0

  const drivers = (fleet?.items ?? []).map(mapDriver)
  const driverTotal =
    toNumber(getValue(overviewData, ['total_drivers', 'drivers'])) || toNumber(fleet?.pagination?.total_items) || drivers.length
  const verifiedDriversFromFleet = drivers.filter((driver) => driver.statusKey === 'verified').length
  const pendingDriversFromFleet = drivers.filter((driver) => driver.statusKey === 'pending').length
  const verifiedDrivers =
    toNumber(getValue(overviewData, ['verified_drivers', 'verified'])) || verifiedDriversFromFleet
  const pendingDrivers =
    toNumber(getValue(driversAnalytics, ['pending', 'pending_drivers'])) || pendingDriversFromFleet

  const today = shiftDay(0)
  const yesterday = shiftDay(-1)

  const ridesByDay = asList(rideStats)
  const revenueByDay = asList(revenue)

  const ridesToday =
    toNumber(getValue(overviewData, ['total_rides_today', 'rides_today'])) ||
    toNumber(ridesByDay.find((row: any) => dayKey(row.period_start || row.date || row.day) === today)?.total_rides ?? ridesByDay.find((row: any) => dayKey(row.period_start || row.date || row.day) === today)?.rides ?? 0)
  const ridesYesterday =
    toNumber(ridesByDay.find((row: any) => dayKey(row.period_start || row.date || row.day) === yesterday)?.total_rides ?? ridesByDay.find((row: any) => dayKey(row.period_start || row.date || row.day) === yesterday)?.rides ?? 0)
  const revenueToday =
    toNumber(getValue(overviewData, ['total_revenue_today', 'revenue_today'])) ||
    toNumber(revenueByDay.find((row: any) => dayKey(row.period_start || row.date || row.day) === today)?.total_revenue_tzs ?? revenueByDay.find((row: any) => dayKey(row.period_start || row.date || row.day) === today)?.total_revenue ?? revenueByDay.find((row: any) => dayKey(row.period_start || row.date || row.day) === today)?.revenue ?? 0)
  const revenueYesterday =
    toNumber(revenueByDay.find((row: any) => dayKey(row.period_start || row.date || row.day) === yesterday)?.total_revenue_tzs ?? revenueByDay.find((row: any) => dayKey(row.period_start || row.date || row.day) === yesterday)?.total_revenue ?? revenueByDay.find((row: any) => dayKey(row.period_start || row.date || row.day) === yesterday)?.revenue ?? 0)

  const driversAnalyticsData = driversAnalytics && typeof driversAnalytics === 'object' && 'data' in driversAnalytics ? (driversAnalytics as any).data : driversAnalytics
  const peakHoursData = peakHours && typeof peakHours === 'object' && 'data' in peakHours ? (peakHours as any).data : peakHours

  return {
    stats: [
      {
        label: 'Total Customers',
        value: formatCount(customerTotal),
        delta: `${formatCount(customerTotal)} registered`,
        up: true,
        hint: 'accounts without a driver profile',
      },
      {
        label: 'Active Drivers',
        value: formatCount(verifiedDrivers || verifiedDriversFromFleet),
        delta: `${formatCount(pendingDrivers)} awaiting review`,
        up: true,
        hint: `of ${formatCount(driverTotal)} registered drivers`,
      },
      {
        label: 'Deliveries Today',
        value: formatCount(ridesToday),
        delta: formatDelta(ridesToday, ridesYesterday),
        up: ridesToday >= ridesYesterday,
        hint: 'compared with yesterday',
      },
      {
        label: 'Revenue Today',
        value: formatMoney(revenueToday),
        delta: formatDelta(revenueToday, revenueYesterday),
        up: revenueToday >= revenueYesterday,
        hint: 'compared with yesterday',
      },
    ],
    overview: overviewData,
    ridesAnalytics: asList(rideStats).map((row: any) => ({
      period: row.period_start || row.date || row.day || '-',
      totalRides: toNumber(row.total_rides ?? row.rides),
      completed: toNumber(row.completed_rides ?? row.completed),
      cancelled: toNumber(row.cancelled_rides ?? row.cancelled),
    })),
    revenueAnalytics: asList(revenue).map((row: any) => ({
      period: row.period_start || row.date || row.day || '-',
      totalRevenue: toNumber(row.total_revenue_tzs ?? row.total_revenue ?? row.revenue ?? row.amount),
    })),
    driversAnalytics: driversAnalyticsData,
    peakHours: asList(peakHoursData)
      .map((row: any) => ({
        hour: row.hour !== undefined ? row.hour : row.period || row.time || '-',
        rides: toNumber(row.total_rides ?? row.rides ?? row.count),
      }))
      .sort((a: any, b: any) => {
        if (typeof a.hour === 'number' && typeof b.hour === 'number') return a.hour - b.hour
        return b.rides - a.rides
      }),
    recentDeliveries: (recent?.items ?? []).map(mapRide),
    topDrivers: drivers.slice(0, 4).map((driver: any) => ({
      id: driver.id,
      name: driver.name,
      status: driver.status,
      rides: driver.rides,
      rating: driver.rating,
      active: driver.statusKey === 'verified',
    })),
    verifiedDrivers: verifiedDrivers || verifiedDriversFromFleet,
  }
}
