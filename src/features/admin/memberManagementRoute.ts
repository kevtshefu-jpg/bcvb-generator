export const MEMBER_MANAGEMENT_PATH = '/admin/membres'
export const MEMBER_MANAGEMENT_ROUTE = 'admin/membres'
export const MEMBER_MANAGEMENT_LEGACY_ROUTES = [
  'admin/profils',
  'admin/utilisateurs',
] as const

export function canAccessMemberManagement(role?: string | null) {
  return role === 'admin'
}
