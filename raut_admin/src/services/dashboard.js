import { API_ROUTES } from '../lib/config.js'
import { apiGet } from './api.js'
import { formatCount, formatDelta, formatMoney, mapDelivery, mapDriver } from './mappers.js'

const FLEET_PAGE_SIZE = 100

const asList = (payload) => (Array.isArray(payload) ? payload : (payload?.items ?? []))

const dayKey = (value) => {
  if (!value) return null

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return null

  return date.toISOString().slice(0, 10)
}

const shiftDay = (offset) => {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + offset)

  return date.toISOString().slice(0, 10)
}

export async function getDashboard() {
  // The analytics overview endpoint is not usable, so the numbers are assembled
  // from the endpoints that do answer.
  const [customers, fleet, rideStats, revenue, recent] = await Promise.all([
    apiGet(API_ROUTES.users, { params: { page: 1, page_size: 1, is_driver: false } }),
    apiGet(API_ROUTES.drivers, {
      params: { page: 1, page_size: FLEET_PAGE_SIZE, sort_by: 'total_rides', sort_order: 'desc' },
    }),
    apiGet(API_ROUTES.analyticsRides),
    apiGet(API_ROUTES.analyticsRevenue),
    apiGet(API_ROUTES.rides, { params: { page: 1, page_size: 5, sort_by: 'created_at', sort_order: 'desc' } }),
  ])

  const customerTotal = customers?.pagination?.total_items ?? 0
  const drivers = (fleet?.items ?? []).map(mapDriver)
  const driverTotal = fleet?.pagination?.total_items ?? drivers.length
  const verifiedDrivers = drivers.filter((driver) => driver.statusKey === 'verified').length
  const pendingDrivers = drivers.filter((driver) => driver.statusKey === 'pending').length

  const today = shiftDay(0)
  const yesterday = shiftDay(-1)

  const ridesByDay = asList(rideStats)
  const revenueByDay = asList(revenue)

  const ridesToday = Number(ridesByDay.find((row) => dayKey(row.period_start) === today)?.total_rides ?? 0)
  const ridesYesterday = Number(ridesByDay.find((row) => dayKey(row.period_start) === yesterday)?.total_rides ?? 0)
  const revenueToday = Number(revenueByDay.find((row) => dayKey(row.period_start) === today)?.total_revenue_tzs ?? 0)
  const revenueYesterday = Number(
    revenueByDay.find((row) => dayKey(row.period_start) === yesterday)?.total_revenue_tzs ?? 0,
  )

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
        value: formatCount(verifiedDrivers),
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
    recentDeliveries: (recent?.items ?? []).map(mapDelivery),
    topDrivers: drivers.slice(0, 4).map((driver) => ({
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
