import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from '../hooks/useSession.js'

function RequireAuth({ children }) {
  const location = useLocation()
  const session = useSession()

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}

export default RequireAuth
