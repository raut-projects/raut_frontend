import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from '../hooks/useSession.js'
import { isAdminRole } from '../lib/roles.js'

function RequireAdmin({ children }) {
  const location = useLocation()
  const session = useSession()

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!isAdminRole(session.role)) {
    return <Navigate to="/request-admin" replace state={{ from: location.pathname }} />
  }

  return children
}

export default RequireAdmin
