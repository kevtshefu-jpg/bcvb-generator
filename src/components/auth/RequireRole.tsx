// src/components/auth/RequireRole.tsx

import { Navigate } from 'react-router-dom'
import {
  isAdmin,
  isDirigeant,
  isCoach,
  isParentReferent
} from '../../config/roles'
import { useAuth } from '../../features/auth/context/AuthContext'

type AllowedRole =
  | 'admin'
  | 'dirigeant'
  | 'coach'
  | 'parent_referent'
  | 'team_staff'

type RequireRoleProps = {
  role?: string | null
  allow: AllowedRole
  children: React.ReactNode
}

export function RequireRole({ role, allow, children }: RequireRoleProps) {
  const { profile } = useAuth()
  const currentRole = role ?? profile?.role
  const authorized =
    allow === 'admin'
      ? isAdmin(currentRole)
      : allow === 'dirigeant'
        ? isDirigeant(currentRole)
        : allow === 'coach'
          ? isCoach(currentRole)
          : allow === 'parent_referent'
            ? isParentReferent(currentRole)
            : allow === 'team_staff'
              ? ['admin', 'dirigeant', 'coach', 'team_staff', 'parent_referent'].includes(currentRole || '')
              : false

  if (!authorized) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
