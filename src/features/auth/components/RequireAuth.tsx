import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../context/AuthContext'
import { useStableSession } from '../../../hooks/useStableSession'
import { normalizeRole } from '../../../config/roles'
import { formatUserFacingError } from '../../../lib/userFacingError'
import { isProfileAllowed } from '../utils/profileAccess'
import { AccessSuspendedState, ErrorState, LoadingState } from '../../../components/ui/PageShell'

type RequireAuthProps = {
  allowedRoles?: UserRole[]
}

export default function RequireAuth({ allowedRoles }: RequireAuthProps) {
  const { profile, loading: profileLoading, profileError } = useAuth()
  const { loading, session, error } = useStableSession()
  const location = useLocation()

  if (loading) {
    return <main className="bcvb-page-loading"><LoadingState title="Chargement de votre espace" description="Vérification de la session en cours." /></main>
  }

  if (error && !session) {
    return <main className="bcvb-page-loading"><ErrorState title="Connexion impossible" description={formatUserFacingError(error, 'Votre session n’a pas pu être vérifiée. Reconnectez-vous pour rétablir l’accès.')} action={<a className="bcvb-button" href="/connexion">Se reconnecter</a>} /></main>
  }

  if (!session) {
    return <Navigate to="/connexion" replace state={{ from: location }} />
  }

  if (profileLoading) {
    return <main className="bcvb-page-loading"><LoadingState title="Chargement de vos droits" description="Vérification de votre profil en cours." /></main>
  }

  if (profileError || !isProfileAllowed(profile)) {
    return <AccessSuspendedState action={<a className="bcvb-button" href="/connexion">Retour à la connexion</a>} />
  }

  const normalizedProfileRole = normalizeRole(profile?.role)
  const normalizedAllowedRoles = allowedRoles?.map((role) => normalizeRole(role))

  if (
    allowedRoles &&
    !normalizedAllowedRoles?.includes(normalizedProfileRole)
  ) {
    return (
      <main className="bcvb-page-loading">
        <div className="bcvb-loading-card">
          <p className="bcvb-eyebrow">Accès refusé</p>
          <h1>Section réservée</h1>
          <p>Cette page est réservée aux administrateurs et responsables techniques autorisés.</p>
          <a className="bcvb-button" href="/dashboard">Retour au tableau de bord</a>
        </div>
      </main>
    )
  }

  return <Outlet />
}
