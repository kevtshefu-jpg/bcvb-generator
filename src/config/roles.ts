// src/config/roles.ts

export type UserRole =
  | 'admin'
  | 'responsable_technique'
  | 'technical_manager'
  | 'dirigeant'
  | 'coach'
  | 'team_staff'
  | 'parent_referent'
  | 'parent'
  | 'joueur'
  | 'benevole'
  | 'arbitre'
  | 'otm'
  | 'membre'
  | 'member'

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrateur',
  responsable_technique: 'Responsable technique',
  technical_manager: 'Responsable technique',
  dirigeant: 'Dirigeant',
  coach: 'Coach',
  team_staff: 'Staff équipe',
  parent_referent: 'Parent référent',
  parent: 'Parent',
  joueur: 'Joueur',
  benevole: 'Bénévole',
  arbitre: 'Arbitre',
  otm: 'OTM',
  membre: 'Membre',
  member: 'Membre'
}

export function normalizeRole(role?: string | null) {
  if (role === 'membre') return 'member'
  if (role === 'technical_manager') return 'responsable_technique'
  return role || 'member'
}

export function isAdmin(role?: string | null) {
  return ['admin', 'responsable_technique'].includes(normalizeRole(role))
}

export function isDirigeant(role?: string | null) {
  return ['dirigeant', 'admin', 'responsable_technique'].includes(normalizeRole(role))
}

export function isCoach(role?: string | null) {
  return ['coach', 'admin', 'responsable_technique'].includes(normalizeRole(role))
}

export function isParentReferent(role?: string | null) {
  return ['parent_referent', 'admin', 'responsable_technique'].includes(normalizeRole(role))
}

export function isTeamStaff(role?: string | null) {
  return ['admin', 'dirigeant', 'coach', 'team_staff', 'parent_referent', 'responsable_technique'].includes(normalizeRole(role))
}

export function canAccessLibrary(role?: string | null) {
  return [
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
  ].includes(normalizeRole(role))
}

export function canAccessEditorialStudio(role?: string | null) {
  return isAdmin(role)
}

export function canPublishClubDocument(role?: string | null) {
  return isAdmin(role)
}

export function canTransformClubDocument(role?: string | null) {
  return isAdmin(role)
}

export function canAccessClubDashboard(role?: string | null) {
  return ['admin', 'dirigeant', 'responsable_technique'].includes(normalizeRole(role))
}

export function canAccessTeamDashboard(role?: string | null) {
  return ['admin', 'responsable_technique', 'dirigeant', 'coach', 'team_staff', 'parent_referent'].includes(normalizeRole(role))
}

export function canManageTeams(role?: string | null) {
  return ['admin', 'dirigeant', 'responsable_technique'].includes(normalizeRole(role))
}

export function canCreateTrainingSession(role?: string | null) {
  return ['admin', 'coach', 'responsable_technique'].includes(normalizeRole(role))
}

export function canCreatePlanning(role?: string | null) {
  return ['admin', 'coach', 'responsable_technique'].includes(normalizeRole(role))
}

export function canManageAttendance(role?: string | null) {
  return ['admin', 'responsable_technique', 'dirigeant', 'coach', 'team_staff', 'parent_referent'].includes(normalizeRole(role))
}

export function canEvaluatePlayers(role?: string | null) {
  return ['admin', 'coach', 'responsable_technique'].includes(normalizeRole(role))
}

export function canReadEvaluationSummary(role?: string | null) {
  return ['admin', 'responsable_technique', 'dirigeant', 'coach'].includes(normalizeRole(role))
}

export function canManageTeamCommunication(role?: string | null) {
  return ['admin', 'responsable_technique', 'dirigeant', 'coach', 'team_staff', 'parent_referent'].includes(normalizeRole(role))
}

export function canManageMatchLogistics(role?: string | null) {
  return ['admin', 'responsable_technique', 'dirigeant', 'coach', 'team_staff', 'parent_referent'].includes(normalizeRole(role))
}

export function canManageUsers(role?: string | null) {
  return isAdmin(role)
}
