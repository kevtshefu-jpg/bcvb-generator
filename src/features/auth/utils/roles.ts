import type { UserRole } from '../context/AuthContext'

export function formatRole(role?: string | null) {
  if (!role) return 'Membre'
  if (role === 'admin') return 'Administrateur'
  if (role === 'dirigeant') return 'Dirigeant'
  if (role === 'responsable_technique') return 'Responsable technique'
  if (role === 'coach') return 'Coach'
  if (role === 'team_staff') return 'Staff équipe'
  if (role === 'parent_referent') return 'Parent référent'
  if (role === 'joueur') return 'Joueur'
  if (role === 'parent') return 'Parent'
  return 'Membre'
}

export function isAdmin(role?: string | null) {
  return role === 'admin' || role === 'responsable_technique'
}

export function isDirigeant(role?: string | null) {
  return role === 'dirigeant'
}

export function isCoach(role?: string | null) {
  return role === 'coach' || role === 'responsable_technique'
}

export function isTeamStaff(role?: string | null) {
  return ['team_staff', 'parent_referent'].includes(role || '')
}

export function isJoueur(role?: string | null) {
  return role === 'joueur'
}

export function isParent(role?: string | null) {
  return role === 'parent'
}

export function canAccessReferentiel(role?: string | null) {
  return ['admin', 'dirigeant', 'responsable_technique', 'coach', 'team_staff', 'parent_referent', 'joueur', 'parent'].includes(role || '')
}

export function canAccessProduction(role?: string | null) {
  return ['admin', 'coach', 'responsable_technique'].includes(role || '')
}

export function canAccessClub(role?: string | null) {
  return ['admin', 'dirigeant', 'responsable_technique', 'parent'].includes(role || '')
}

export function canAccessAdmin(role?: string | null) {
  return role === 'admin' || role === 'responsable_technique'
}

export function getRoleHomeLabel(role?: UserRole | null) {
  if (role === 'admin') return 'Pilotage plateforme'
  if (role === 'dirigeant') return 'Pilotage club'
  if (role === 'responsable_technique') return 'Pilotage sportif'
  if (role === 'coach') return 'Espace coach'
  if (role === 'team_staff') return 'Espace équipe'
  if (role === 'parent_referent') return 'Espace équipe'
  if (role === 'joueur') return 'Espace joueur'
  if (role === 'parent') return 'Espace parent'
  return 'Espace membre'
}
