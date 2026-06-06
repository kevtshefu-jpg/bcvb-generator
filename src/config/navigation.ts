import { SITE_CATEGORIES, canAccessCategory } from './siteCategories.js'
import type { SiteCategory, SiteRole } from './siteCategories.js'

export type NavigationRole = SiteRole

export type NavItem = SiteCategory & {
  visible: (role?: string | null) => boolean
}

export const NAV_ITEMS: NavItem[] = SITE_CATEGORIES.map((category) => ({
  ...category,
  visible: (role) => canAccessCategory(category, role),
}))
