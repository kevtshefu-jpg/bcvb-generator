// src/components/auth/RequireRole.tsx

import { Navigate } from 'react-router-dom'
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
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
