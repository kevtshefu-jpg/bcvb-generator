import type { UserRole } from '../../../config/roles'

export const ACCESS_SUSPENDED_MESSAGE =
  "Votre profil n’a pas pu être vérifié. L’accès est suspendu par sécurité."

const KNOWN_ROLES = new Set<UserRole>([
  'admin',
  'responsable_technique',
  'technical_manager',
  'dirigeant',
  'coach',
  'team_staff',
  'parent_referent',
  'parent',
  'joueur',
  'benevole',
  'arbitre',
  'otm',
  'membre',
  'member',
])

export type AccessProfile = {
  role?: string | null
  is_active?: boolean | null
  profile_status?: string | null
}

export function isKnownUserRole(role?: string | null): role is UserRole {
  return typeof role === 'string' && KNOWN_ROLES.has(role as UserRole)
}

export function isProfileAllowed(
  profile?: AccessProfile | null,
): profile is AccessProfile & { role: UserRole; is_active: true; profile_status: 'active' } {
  return Boolean(
    profile &&
      profile.is_active === true &&
      profile.profile_status === 'active' &&
      isKnownUserRole(profile.role),
  )
}
