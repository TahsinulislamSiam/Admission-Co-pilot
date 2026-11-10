import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore, selectIsAuthenticated } from '@/store/authStore'
import { ROUTES } from './constants'

/**
 * Wraps student-only routes. Unauthenticated visitors are redirected to
 * login with a `from` location so they land back after signing in.
 */
export function ProtectedRoute() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
