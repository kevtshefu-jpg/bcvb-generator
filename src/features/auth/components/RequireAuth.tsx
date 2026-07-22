import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../context/AuthContext'
import { useStableSession } from '../../../hooks/useStableSession'
import { normalizeRole } from '../../../config/roles'
import { formatUserFacingError } from '../../../lib/userFacingError'
import { ACCESS_SUSPENDED_MESSAGE, isProfileAllowed } from '../utils/profileAccess'

type RequireAuthProps = {
  allowedRoles?: UserRole[]
}

export default function RequireAuth({ allowedRoles }: RequireAuthProps) {
  const { profile, loading: profileLoading, profileError } = useAuth()
  const { loading, session, error } = useStableSession()
  const location = useLocation()

  if (loading) {
    return (
      <main className="bcvb-page-loading">
        <div className="bcvb-loading-card">
          <p className="bcvb-eyebrow">BCVB Référentiel</p>
          <h1>Chargement de ton espace…</h1>
          <p>Vérification de la session en cours.</p>
        </div>
      </main>
    )
  }

  if (error && !session) {
    return (
      <main className="bcvb-page-loading">
        <div className="bcvb-loading-card">
          <p className="bcvb-eyebrow">Session</p>
          <h1>Impossible de charger l’espace membre</h1>
          <p>{formatUserFacingError(error, 'Ta session n’a pas pu être vérifiée. Reconnecte-toi pour relancer l’accès sécurisé.')}</p>
          <a className="bcvb-button" href="/connexion">Se reconnecter</a>
        </div>
      </main>
    )
  }

  if (!session) {
    return <Navigate to="/connexion" replace state={{ from: location }} />
  }

  if (profileLoading) {
    return (
      <main className="bcvb-page-loading">
        <div className="bcvb-loading-card">
          <p className="bcvb-eyebrow">Profil</p>
          <h1>Chargement des droits…</h1>
          <p>Vérification du rôle associé à ton compte.</p>
        </div>
      </main>
    )
  }

  if (profileError || !isProfileAllowed(profile)) {
    return (
      <main className="bcvb-page-loading" role="alert">
        <div className="bcvb-loading-card">
          <p className="bcvb-eyebrow">Accès suspendu</p>
          <h1>Profil non vérifié</h1>
          <p>{ACCESS_SUSPENDED_MESSAGE}</p>
          <a className="bcvb-button" href="/connexion">Retour à la connexion</a>
        </div>
      </main>
    )
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
