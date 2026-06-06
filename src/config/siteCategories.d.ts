export type SiteRole =
  | 'admin'
  | 'coach'
  | 'dirigeant'
  | 'responsable_technique'
  | 'parent_referent'
  | 'team_staff'
  | 'joueur'
  | 'parent'
  | 'member'
  | 'membre'

export type SiteCategoryColor = 'green' | 'blue'

export type SiteCategory = {
  id: string
  label: string
  shortLabel: string
  group: string
  path: string
  color: SiteCategoryColor
  roles: SiteRole[]
  adminOnly: boolean
  description: string
  purpose: string
  mainActions: string[]
  subModules: string[]
}

export const SITE_ROLES: SiteRole[]
export const SITE_GROUPS: string[]
export const SITE_CATEGORIES: SiteCategory[]
export function normalizeSiteRole(role?: string | null): SiteRole
export function canAccessCategory(category: SiteCategory, role?: string | null): boolean
export function getVisibleSiteCategories(role?: string | null): SiteCategory[]
export function getSiteCategoryById(id: string): SiteCategory | undefined
