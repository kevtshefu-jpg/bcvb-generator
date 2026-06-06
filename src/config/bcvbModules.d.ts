import type { SiteCategory, SiteRole } from './siteCategories.js'

export type BcvbRole = SiteRole

export type BcvbModule = SiteCategory & {
  section: string
  allowedRoles: SiteRole[]
  icon: string
}

export const BCVB_ROLES: BcvbRole[]
export const BCVB_MODULES: BcvbModule[]
export function normalizeRole(role?: string | null): BcvbRole
export function isModuleAllowed(module: BcvbModule, role?: string | null): boolean
export function getVisibleBcvbModules(role?: string | null): BcvbModule[]
export function getBcvbModuleById(id: string): BcvbModule | undefined
