import type { UserRole } from '../context/AuthContext'

export function formatRole(role?: string | null) {
  if (!role) return 'Membre'
  if (role === 'admin') return 'Administrateur'
  if (role === 'dirigeant') return 'Dirigeant'
  if (role === 'coach') return 'Coach'
  if (role === 'joueur') return 'Joueur'
  if (role === 'parent') return 'Parent'
  return 'Membre'
}

export function isAdmin(role?: string | null) {
  return role === 'admin'
}

export function isDirigeant(role?: string | null) {
  return role === 'dirigeant'
}

export function isCoach(role?: string | null) {
  return role === 'coach'
}

export function isJoueur(role?: string | null) {
  return role === 'joueur'
}

export function isParent(role?: string | null) {
  return role === 'parent'
}

export function canAccessReferentiel(role?: string | null) {
  return ['admin', 'dirigeant', 'coach', 'joueur', 'parent'].includes(role || '')
}

export function canAccessProduction(role?: string | null) {
  return ['admin', 'coach'].includes(role || '')
}

export function canAccessClub(role?: string | null) {
  return ['admin', 'dirigeant', 'parent'].includes(role || '')
}

export function canAccessAdmin(role?: string | null) {
  return role === 'admin'
}

export function getRoleHomeLabel(role?: UserRole | null) {
  if (role === 'admin') return 'Pilotage plateforme'
  if (role === 'dirigeant') return 'Pilotage club'
  if (role === 'coach') return 'Espace coach'
  if (role === 'joueur') return 'Espace joueur'
  if (role === 'parent') return 'Espace parent'
  return 'Espace membre'
}
