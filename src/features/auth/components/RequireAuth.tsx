import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../context/AuthContext'

type RequireAuthProps = {
  allowedRoles?: UserRole[]
}

export default function RequireAuth({ allowedRoles }: RequireAuthProps) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div style={{ padding: 24 }}>Chargement...</div>
  }

  if (!user) {
    return <Navigate to="/connexion" replace state={{ from: location }} />
  }

  if (allowedRoles && profile?.role && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}