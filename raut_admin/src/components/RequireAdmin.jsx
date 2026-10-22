import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from '../hooks/useSession.js'
import { ROLE_REVALIDATE_MS } from '../lib/config.js'
import { firstRole, formatRole, isAdminRole } from '../lib/roles.js'
import { fetchCurrentUser } from '../services/auth.js'
import { clearSession, updateSession } from '../services/tokenStore.js'

let verification = null

// One request at a time, shared by every mount that needs the role.
const verifyRole = () => {
  if (!verification) {
    verification = fetchCurrentUser().finally(() => {
      verification = null
    })
  }

  return verification
}

const isRoleFresh = (session) =>
  Boolean(session?.roleVerifiedAt) && Date.now() - session.roleVerifiedAt < ROLE_REVALIDATE_MS

function GateLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
        <span
          className="h-7 w-7 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-slate-500">Checking your access…</p>
      </div>
    </div>
  )
}

function RequireAdmin({ children }) {
  const location = useLocation()
  const session = useSession()
  const [check, setCheck] = useState('idle')

  const roleIsFresh = isRoleFresh(session)

  useEffect(() => {
    if (!session || roleIsFresh) return undefined

    let active = true

    verifyRole()
      .then(({ role }) => {
        if (!active) return

        const nextRole = firstRole(role, session.role) ?? 'user'

        updateSession({
          role: nextRole,
          roleLabel: formatRole(nextRole),
          roleVerifiedAt: Date.now(),
        })

        setCheck('passed')
      })
      .catch((error) => {
        if (!active) return

        // The session is gone, so start over from the login page.
        if (error?.status === 401) {
          clearSession()
          setCheck('signed-out')
          return
        }

        // The server could not be reached. Keep the role we already trust rather
        // than locking a signed in admin out over a dropped connection.
        setCheck('failed')
      })

    return () => {
      active = false
    }
  }, [session, roleIsFresh])

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (check === 'signed-out') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  const verified = roleIsFresh || check === 'passed' || check === 'failed'

  if (!verified) {
    return <GateLoader />
  }

  if (!isAdminRole(session.role)) {
    return <Navigate to="/request-admin" replace state={{ from: location.pathname }} />
  }

  return children
}

export default RequireAdmin
