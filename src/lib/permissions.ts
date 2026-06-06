export type AppRole = 'admin' | 'coach' | 'dirigeant' | 'parent_referent' | 'team_staff' | 'membre' | 'member' | 'joueur' | 'parent'

export type Permission =
  | 'library:read'
  | 'documents:download'
  | 'documents:ai'
  | 'documents:transform'
  | 'sessions:create'
  | 'sessions:update'
  | 'teams:read'
  | 'teams:manage'
  | 'roster:import'
  | 'attendance:manage'
  | 'evaluations:manage'
  | 'evaluations:read-summary'
  | 'planning:read'
  | 'planning:update'
  | 'users:manage'
  | 'logistics:manage'

export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  admin: [
    'library:read',
    'documents:download',
    'documents:ai',
    'documents:transform',
    'sessions:create',
    'sessions:update',
    'teams:read',
    'teams:manage',
    'roster:import',
    'attendance:manage',
    'evaluations:manage',
    'evaluations:read-summary',
    'planning:read',
    'planning:update',
    'users:manage',
    'logistics:manage',
  ],
  coach: [
    'library:read',
    'documents:download',
    'sessions:create',
    'sessions:update',
    'teams:read',
    'roster:import',
    'attendance:manage',
    'evaluations:manage',
    'evaluations:read-summary',
    'planning:read',
    'planning:update',
  ],
  dirigeant: [
    'library:read',
    'documents:download',
    'teams:read',
    'planning:read',
    'evaluations:read-summary',
  ],
  parent_referent: [
    'library:read',
    'documents:download',
    'teams:read',
    'attendance:manage',
    'planning:read',
    'logistics:manage',
  ],
  team_staff: [
    'library:read',
    'documents:download',
    'teams:read',
    'attendance:manage',
    'planning:read',
    'logistics:manage',
  ],
  membre: ['library:read', 'documents:download'],
  member: ['library:read', 'documents:download'],
  joueur: ['library:read'],
  parent: ['library:read', 'documents:download'],
}

export function hasPermission(role: string | null | undefined, permission: Permission) {
  const key = (role || 'member') as AppRole
  return ROLE_PERMISSIONS[key]?.includes(permission) ?? false
}

export function hasAnyRole(role: string | null | undefined, allowedRoles: string[]) {
  return allowedRoles.includes(role || 'member')
}
