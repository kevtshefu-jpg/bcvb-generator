import { normalizeRole } from '../../config/roles'
import type { TechnicalDashboardRole } from './types'

export function getTechnicalDashboardRole(role?: string | null): TechnicalDashboardRole | null {
  const normalizedRole = normalizeRole(role)
  return ['admin', 'responsable_technique', 'dirigeant'].includes(normalizedRole)
    ? normalizedRole as TechnicalDashboardRole
    : null
}

export function canViewTechnicalDashboard(role?: string | null): boolean {
  return getTechnicalDashboardRole(role) !== null
}
