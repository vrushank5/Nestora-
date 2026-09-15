import { Navigate, useLocation } from 'react-router-dom'
import { useMemo } from 'react'
import { useAuth } from '../context/useAuth.js'

function ProtectedRoute({ allowedRoles, children }) {
  const location = useLocation()
  const { authChecking, isAuthenticated, user } = useAuth()
  const loginRedirectState = useMemo(
    () => ({ from: { pathname: location.pathname, search: location.search, hash: location.hash } }),
    [location.hash, location.pathname, location.search],
  )

  // While the auth state is still being determined, render nothing.
  // This prevents a flash of the login redirect before the token is validated.
  if (authChecking) {
    return null
  }

  if (!isAuthenticated) {
    if (location.pathname === '/login') return null

    return <Navigate to="/login" replace state={loginRedirectState} />
  }

  if (allowedRoles?.length && !allowedRoles.includes(Number(user.roleId))) {
    if (location.pathname === '/') return null

    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
