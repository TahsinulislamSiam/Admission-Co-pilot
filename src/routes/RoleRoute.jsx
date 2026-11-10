import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore, selectIsAuthenticated, selectIsAdmin } from '@/store/authStore'
import { ROLES } from '@/lib/constants'
import { ROUTES } from './constants'

/**
 * Role-guarded admin routes. Students are bounced to their dashboard;
 * unauthenticated visitors go to login.
 */
export function RoleRoute({ role = ROLES.ADMIN }) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const isAdmin = useAuthStore(selectIsAdmin)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />
  }
  if (role === ROLES.ADMIN && !isAdmin) {
    return <Navigate to={ROUTES.dashboard} replace />
  }
  return <Outlet />
}
