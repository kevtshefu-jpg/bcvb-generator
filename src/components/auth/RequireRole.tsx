// src/components/auth/RequireRole.tsx

import {
  isAdmin,
  isDirigeant,
  isCoach,
  isParentReferent,
  isTeamStaff,
  normalizeRole,
} from '../../config/roles'
import { useAuth } from '../../features/auth/context/AuthContext'
import { ACCESS_SUSPENDED_MESSAGE, isProfileAllowed } from '../../features/auth/utils/profileAccess'

type AllowedRole =
  | 'admin'
  | 'responsable_technique'
  | 'dirigeant'
  | 'coach'
  | 'parent_referent'
  | 'team_staff'
  | 'member'

type RequireRoleProps = {
  role?: string | null
  allow: AllowedRole
  children: React.ReactNode
}

export function RequireRole({ role, allow, children }: RequireRoleProps) {
  const { profile, loading, profileError } = useAuth()

  if (loading) {
    return <main className="bcvb-page-loading"><div className="bcvb-loading-card"><h1>Chargement des droits…</h1></div></main>
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

  // Le rôle fourni par une page ne constitue jamais une source d'autorité.
  // S'il est présent, il doit correspondre au rôle vérifié dans le profil.
  if (role && normalizeRole(role) !== normalizeRole(profile.role)) {
    return <AccessRefused />
  }

  const currentRole = normalizeRole(profile.role)
  const authorized =
    allow === 'admin'
      ? isAdmin(currentRole)
      : allow === 'responsable_technique'
        ? currentRole === 'responsable_technique' || isAdmin(currentRole)
      : allow === 'dirigeant'
        ? isDirigeant(currentRole)
        : allow === 'coach'
          ? isCoach(currentRole)
          : allow === 'parent_referent'
            ? isParentReferent(currentRole)
            : allow === 'team_staff'
              ? isTeamStaff(currentRole)
              : allow === 'member'
                ? Boolean(currentRole)
              : false

  if (!authorized) {
    return <AccessRefused />
  }

  return <>{children}</>
}

function AccessRefused() {
  return (
    <main className="bcvb-page-loading">
      <div className="bcvb-loading-card">
        <p className="bcvb-eyebrow">Accès refusé</p>
        <h1>Droits insuffisants</h1>
        <p>Cette action est réservée aux profils autorisés par le club.</p>
        <a className="bcvb-button" href="/dashboard">Retour au tableau de bord</a>
      </div>
    </main>
  )
}
