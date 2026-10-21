import { db } from '../mocks/db.js'
import { requireSession, wait } from './mockApi.js'

export async function getDashboard() {
  requireSession()
  await wait()

  const active = db.riders
    .filter((rider) => rider.status !== 'Offline')
    .sort((a, b) => b.deliveries - a.deliveries)
    .slice(0, 4)
    .map((rider) => ({
      name: rider.name,
      zone: rider.zone,
      deliveries: rider.deliveries,
      online: true,
    }))

  return {
    stats: db.stats,
    recentDeliveries: db.deliveries.slice(0, 5),
    topRiders: active,
    onlineRiders: db.riders.filter((rider) => rider.status !== 'Offline').length,
  }
}
