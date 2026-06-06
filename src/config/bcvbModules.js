import { SITE_CATEGORIES, SITE_ROLES, canAccessCategory, getSiteCategoryById, getVisibleSiteCategories, normalizeSiteRole } from './siteCategories.js'

export const BCVB_ROLES = SITE_ROLES

export const BCVB_MODULES = SITE_CATEGORIES.map((category) => ({
  ...category,
  section: category.group,
  allowedRoles: category.roles,
  icon: category.color === 'green' ? '●' : '◆',
}))

export function normalizeRole(role) {
  return normalizeSiteRole(role)
}

export function isModuleAllowed(module, role) {
  if (module.roles) return canAccessCategory(module, role)
  return module.allowedRoles.includes(normalizeSiteRole(role))
}

export function getVisibleBcvbModules(role) {
  return getVisibleSiteCategories(role).map((category) => ({
    ...category,
    section: category.group,
    allowedRoles: category.roles,
    icon: category.color === 'green' ? '●' : '◆',
  }))
}

export function getBcvbModuleById(id) {
  const category = getSiteCategoryById(id)
  if (!category) return undefined
  return {
    ...category,
    section: category.group,
    allowedRoles: category.roles,
    icon: category.color === 'green' ? '●' : '◆',
  }
}
