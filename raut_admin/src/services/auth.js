const SESSION_KEY = 'raut_admin_session'

const mockAdmins = [
  {
    id: 1,
    name: 'Alex Smith',
    phone: '+2557545550132',
    code: 'RAUT-2026',
    role: 'Super Admin',
    initials: 'AS',
  },
  {
    id: 2,
    name: 'Neema Joseph',
    phone: '+2557335550187',
    code: 'OPS-7411',
    role: 'Operations',
    initials: 'NJ',
  },
]

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const normalizePhone = (value) => value.replace(/[\s()-]/g, '')

export const isValidPhone = (value) => {
  const phone = normalizePhone(value)
  return /^\+?\d{9,15}$/.test(phone)
}

const toSession = (admin) => ({
  id: admin.id,
  name: admin.name,
  phone: admin.phone,
  role: admin.role,
  initials: admin.initials,
  signedInAt: new Date().toISOString(),
})

export async function signIn({ phone, code }) {
  await wait(600)

  const match = mockAdmins.find((admin) => admin.phone === normalizePhone(phone))

  if (!match) {
    return { ok: false, error: 'No admin account found for that phone number.' }
  }

  if (match.code !== code.trim()) {
    return { ok: false, error: 'That secret code is not correct. Please try again.' }
  }

  const session = toSession(match)
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))

  return { ok: true, admin: session }
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY)
}

export function getToken() {
  const session = getSession()
  return session ? `raut.${session.id}.${session.signedInAt}` : null
}
