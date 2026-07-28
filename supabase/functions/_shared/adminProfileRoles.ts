export const ADMIN_ASSIGNABLE_ROLES = [
  'admin',
  'responsable_technique',
  'dirigeant',
  'coach',
  'team_staff',
  'parent_referent',
  'parent',
  'joueur',
  'benevole',
  'arbitre',
  'otm',
  'member',
] as const

export type AdminAssignableRole = (typeof ADMIN_ASSIGNABLE_ROLES)[number]

export const ADMIN_SENSITIVE_ROLES: readonly AdminAssignableRole[] = [
  'admin',
  'responsable_technique',
]

export function isAdminAssignableRole(value: unknown): value is AdminAssignableRole {
  return typeof value === 'string' && ADMIN_ASSIGNABLE_ROLES.includes(value as AdminAssignableRole)
}

export function isSensitiveAdminRole(value: unknown): value is AdminAssignableRole {
  return isAdminAssignableRole(value) && ADMIN_SENSITIVE_ROLES.includes(value)
}
