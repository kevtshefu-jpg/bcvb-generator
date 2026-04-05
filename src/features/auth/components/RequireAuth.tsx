import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AccessDeniedPage from '../../shared/pages/AccessDeniedPage'

type RequireAuthProps = {
  allowedRoles?: Array<'admin' | 'dirigeant' | 'coach' | 'member'>
}

export default function RequireAuth({ allowedRoles }: RequireAuthProps) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div style={{ padding: 24 }}>Chargement...</div>
  }

  if (!user) {
    return <Navigate to="/connexion" state={{ from: location }} replace />
  }

  if (!profile || !profile.is_active) {
    return <Navigate to="/connexion" replace />
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <AccessDeniedPage />
  }

  return <Outlet />
}

