import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../context/AuthContext'
import { useStableSession } from '../../../hooks/useStableSession'
import { PRESENTATION_MODE } from '../../../config/presentationMode'
import { normalizeRole } from '../../../config/roles'
import { formatUserFacingError } from '../../../lib/userFacingError'

type RequireAuthProps = {
  allowedRoles?: UserRole[]
}

export default function RequireAuth({ allowedRoles }: RequireAuthProps) {
  const { profile, loading: profileLoading } = useAuth()
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

  if (allowedRoles && profileLoading) {
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

  const normalizedProfileRole = normalizeRole(profile?.role)
  const normalizedAllowedRoles = allowedRoles?.map((role) => normalizeRole(role))

  if (
    allowedRoles &&
    profile?.role &&
    !normalizedAllowedRoles?.includes(normalizedProfileRole)
  ) {
    if (PRESENTATION_MODE) {
      return (
        <main className="bcvb-page-loading">
          <div className="bcvb-loading-card">
            <p className="bcvb-eyebrow">Mode présentation</p>
            <h1>Accès réservé</h1>
            <p>Cette section est disponible avec un profil autorisé. La démonstration peut continuer depuis le tableau de bord ou la page Démo commission.</p>
            <a className="bcvb-button" href="/demo-commission">Voir la démo commission</a>
          </div>
        </main>
      )
    }
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

  if (allowedRoles && !profile?.role) {
    return (
      <main className="bcvb-page-loading">
        <div className="bcvb-loading-card">
          <p className="bcvb-eyebrow">Accès</p>
          <h1>Droits indisponibles</h1>
          <p>La session est active, mais le profil membre n’a pas pu être chargé.</p>
          <a className="bcvb-button" href="/dashboard">Retour espace membre</a>
        </div>
      </main>
    )
  }

  return <Outlet />
}
