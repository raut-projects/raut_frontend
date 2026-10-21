import {
  customerFixtures,
  riderFixtures,
  deliveryFixtures,
  dashboardStats,
} from './fixtures.js'

const clone = (value) => value.map((row) => ({ ...row }))

export const db = {
  customers: clone(customerFixtures),
  riders: clone(riderFixtures),
  deliveries: clone(deliveryFixtures),
  stats: clone(dashboardStats),
}

export function resetDb() {
  db.customers = clone(customerFixtures)
  db.riders = clone(riderFixtures)
  db.deliveries = clone(deliveryFixtures)
  db.stats = clone(dashboardStats)
}
