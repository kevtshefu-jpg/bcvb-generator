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
  const { profile } = useAuth()
  const currentRole = normalizeRole(role ?? profile?.role)
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

  return <>{children}</>
}
