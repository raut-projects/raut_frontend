const BASE_DATE = Date.UTC(2026, 9, 19)

const dateString = (offsetDays) => {
  const date = new Date(BASE_DATE)
  date.setUTCDate(date.getUTCDate() - offsetDays)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

const slug = (name) => name.toLowerCase().replace(/\s+/g, '.')

const customerPhone = (index) => {
  const prefixes = ['754', '733', '712', '655', '784']
  const prefix = prefixes[index % prefixes.length]
  const middle = 500 + ((index * 37) % 400)
  const last = 1000 + ((index * 811) % 9000)
  return `+255 ${prefix} ${middle} ${last}`
}

const customerSeeds = [
  ['Maya Chen', 'Active', 42, 'Jan 12, 2025'],
  ['Liam Torres', 'Active', 17, 'Feb 3, 2025'],
  ['Emma Wilson', 'Active', 89, 'Nov 21, 2024'],
  ['Noah Patel', 'Inactive', 5, 'Aug 7, 2025'],
  ['Olivia Kim', 'Active', 63, 'Sep 30, 2024'],
  ['Ethan Brown', 'Active', 28, 'Mar 18, 2025'],
  ['Ava Nguyen', 'Inactive', 11, 'Jun 2, 2025'],
  ['Lucas Silva', 'Active', 54, 'Dec 9, 2024'],
  ['Grace Mwangi', 'Active', 38, 'Feb 14, 2025'],
  ['Henry Osei', 'Active', 12, 'Apr 6, 2025'],
  ['Ivy Robinson', 'Inactive', 7, 'Jul 22, 2025'],
  ['Jack Thompson', 'Active', 61, 'Oct 11, 2024'],
  ['Kofi Mensah', 'Active', 23, 'May 29, 2025'],
  ['Lena Fischer', 'Inactive', 4, 'Aug 30, 2025'],
  ['Malik Diallo', 'Active', 47, 'Mar 7, 2025'],
  ['Nadia Hassan', 'Active', 19, 'Jan 28, 2025'],
  ['Omar Haddad', 'Active', 33, 'Jun 19, 2025'],
  ['Quinn Barrett', 'Inactive', 9, 'Sep 3, 2024'],
  ['Rosa Delgado', 'Active', 25, 'Apr 25, 2025'],
  ['Samir Khan', 'Active', 58, 'Dec 1, 2024'],
  ['Tara Nolan', 'Active', 15, 'Feb 27, 2025'],
  ['Umar Juma', 'Inactive', 6, 'Jul 8, 2025'],
  ['Vera Kowalski', 'Active', 31, 'May 12, 2025'],
  ['Wanjiku Kariuki', 'Active', 44, 'Nov 4, 2024'],
  ['Yusuf Ali', 'Active', 20, 'Mar 30, 2025'],
  ['Zara Abdi', 'Inactive', 8, 'Aug 18, 2025'],
  ['Caleb Ncube', 'Active', 27, 'Jan 6, 2025'],
  ['Ines Duarte', 'Active', 36, 'Oct 25, 2024'],
  ['Noel Kariyo', 'Inactive', 10, 'Jun 5, 2025'],
  ['Paulo Garcia', 'Active', 22, 'Feb 8, 2025'],
]

const riderSeeds = [
  ['Daniel Okafor', 'Delivering', 'Downtown', 18, 4.9],
  ['Sofia Rossi', 'Delivering', 'Westside', 15, 4.8],
  ['Jonas Berg', 'Online', 'Midtown', 12, 4.7],
  ['Aisha Bello', 'Offline', 'Harbor', 9, 4.9],
  ['Marco Silva', 'Online', 'Eastend', 7, 4.6],
  ['Priya Sharma', 'Delivering', 'Northgate', 21, 5.0],
  ['Tom Novak', 'Offline', 'Southbank', 4, 4.4],
  ['Zoe Laurent', 'Online', 'Downtown', 11, 4.8],
  ['Amos Kiptoo', 'Delivering', 'Harbor', 14, 4.7],
  ['Bianca Ferreira', 'Online', 'Midtown', 16, 4.9],
  ['Carlos Mendes', 'Offline', 'Downtown', 6, 4.5],
  ['Divya Menon', 'Delivering', 'Westside', 19, 4.8],
  ['Emmanuel Boateng', 'Online', 'Southbank', 10, 4.6],
  ['Fatuma Said', 'Delivering', 'Harbor', 17, 4.9],
  ['Gabriel Ncube', 'Offline', 'Northgate', 5, 4.3],
  ['Hana Sato', 'Online', 'Eastend', 13, 4.7],
  ['Ibrahim Toure', 'Delivering', 'Downtown', 20, 4.8],
  ['Julia Costa', 'Offline', 'Westside', 8, 4.5],
  ['Karim Ben Ali', 'Online', 'Midtown', 12, 4.6],
  ['Lucy Wang', 'Delivering', 'Southbank', 15, 4.8],
  ['Mariam Diallo', 'Online', 'Northgate', 11, 4.7],
  ['Nabil Haddad', 'Offline', 'Eastend', 7, 4.4],
  ['Olga Petrova', 'Delivering', 'Harbor', 18, 4.9],
  ['Samuel Okoro', 'Online', 'Downtown', 9, 4.5],
]

const zones = ['Downtown', 'Westside', 'Midtown', 'Harbor', 'Eastend', 'Northgate', 'Southbank']

const deliveryStatuses = ['Delivered', 'In transit', 'Pending', 'Cancelled']

const deliverySeeds = [
  ['#DLV-9041', 'Maya Chen', 'Daniel Okafor', 'Downtown', '24.50', 'Delivered', 0],
  ['#DLV-9040', 'Liam Torres', 'Sofia Rossi', 'Westside', '16.00', 'In transit', 0],
  ['#DLV-9039', 'Emma Wilson', 'Jonas Berg', 'Midtown', '42.75', 'In transit', 0],
  ['#DLV-9038', 'Noah Patel', 'Aisha Bello', 'Harbor', '9.25', 'Pending', 0],
  ['#DLV-9037', 'Olivia Kim', 'Marco Silva', 'Eastend', '31.10', 'Delivered', 0],
  ['#DLV-9036', 'Ethan Brown', 'Priya Sharma', 'Northgate', '12.80', 'Delivered', 1],
  ['#DLV-9035', 'Ava Nguyen', 'Tom Novak', 'Southbank', '18.45', 'Cancelled', 1],
  ['#DLV-9034', 'Lucas Silva', 'Zoe Laurent', 'Downtown', '27.60', 'Delivered', 1],
  ['#DLV-9033', 'Maya Chen', 'Daniel Okafor', 'Downtown', '8.90', 'Delivered', 1],
  ['#DLV-9032', 'Emma Wilson', 'Sofia Rossi', 'Westside', '54.20', 'In transit', 1],
  ['#DLV-9031', 'Noah Patel', 'Jonas Berg', 'Midtown', '6.75', 'Pending', 2],
  ['#DLV-9030', 'Olivia Kim', 'Aisha Bello', 'Harbor', '39.99', 'Delivered', 2],
  ['#DLV-9029', 'Liam Torres', 'Priya Sharma', 'Northgate', '21.30', 'Delivered', 2],
  ['#DLV-9028', 'Ava Nguyen', 'Marco Silva', 'Eastend', '14.05', 'Cancelled', 2],
  ['#DLV-9027', 'Ethan Brown', 'Zoe Laurent', 'Downtown', '33.50', 'In transit', 2],
]

export const customerFixtures = customerSeeds.map(([name, status, orders, joined], index) => ({
  id: index + 1,
  name,
  email: `${slug(name)}@example.com`,
  phone: customerPhone(index),
  orders,
  joined,
  status,
}))

export const riderFixtures = riderSeeds.map(([name, status, zone, deliveries, rating], index) => ({
  id: index + 1,
  name,
  phone: customerPhone(index + 11),
  status,
  zone,
  deliveries,
  rating,
}))

const customerNames = customerSeeds.map(([name]) => name)
const riderNames = riderSeeds.map(([name]) => name)

const generatedDeliveries = Array.from({ length: 45 }, (_, index) => {
  const customer = customerNames[(index * 7 + 3) % customerNames.length]
  const rider = riderNames[(index * 5 + 2) % riderNames.length]
  const zone = zones[(index * 3) % zones.length]
  const amount = (7.5 + ((index * 13.7) % 46)).toFixed(2)
  const status = deliveryStatuses[(index * 3) % deliveryStatuses.length]
  const id = 9041 - (index + deliverySeeds.length)

  return {
    id: `#DLV-${id}`,
    customer,
    rider,
    zone,
    amount: `$${amount}`,
    status,
    date: dateString(index + 3),
  }
})

export const deliveryFixtures = [
  ...deliverySeeds.map(([id, customer, rider, zone, amount, status, offset]) => ({
    id,
    customer,
    rider,
    zone,
    amount: `$${amount}`,
    status,
    date: dateString(offset),
  })),
  ...generatedDeliveries,
]

export const dashboardStats = [
  { label: 'Total Customers', value: '2,847', delta: '+12.4%', up: true, hint: 'vs. last month' },
  { label: 'Active Riders', value: '164', delta: '+4 this week', up: true, hint: 'of 189 registered' },
  { label: 'Deliveries Today', value: '1,092', delta: '+8.2%', up: true, hint: 'vs. yesterday' },
  { label: 'Revenue Today', value: '$18,420', delta: '-2.1%', up: false, hint: 'vs. yesterday' },
]
