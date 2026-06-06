// src/config/roles.ts

export type UserRole =
  | 'admin'
  | 'dirigeant'
  | 'coach'
  | 'team_staff'
  | 'parent_referent'
  | 'member'

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrateur',
  dirigeant: 'Dirigeant',
  coach: 'Coach',
  team_staff: 'Staff équipe',
  parent_referent: 'Parent référent',
  member: 'Membre'
}

export function isAdmin(role?: string | null) {
  return role === 'admin'
}

export function isDirigeant(role?: string | null) {
  return role === 'dirigeant' || role === 'admin'
}

export function isCoach(role?: string | null) {
  return role === 'coach' || role === 'admin'
}

export function isParentReferent(role?: string | null) {
  return role === 'parent_referent' || role === 'admin'
}

export function isTeamStaff(role?: string | null) {
  return ['admin', 'dirigeant', 'coach', 'team_staff', 'parent_referent'].includes(role || '')
}

export function canAccessLibrary(role?: string | null) {
  return ['admin', 'dirigeant', 'coach', 'team_staff', 'parent_referent', 'member'].includes(role || '')
}

export function canAccessEditorialStudio(role?: string | null) {
  return role === 'admin'
}

export function canPublishClubDocument(role?: string | null) {
  return role === 'admin'
}

export function canTransformClubDocument(role?: string | null) {
  return role === 'admin'
}

export function canAccessClubDashboard(role?: string | null) {
  return role === 'admin' || role === 'dirigeant'
}

export function canAccessTeamDashboard(role?: string | null) {
  return ['admin', 'dirigeant', 'coach', 'team_staff', 'parent_referent'].includes(role || '')
}

export function canManageTeams(role?: string | null) {
  return role === 'admin' || role === 'dirigeant'
}

export function canCreateTrainingSession(role?: string | null) {
  return role === 'coach' || role === 'admin'
}

export function canCreatePlanning(role?: string | null) {
  return role === 'coach' || role === 'admin'
}

export function canManageAttendance(role?: string | null) {
  return ['admin', 'dirigeant', 'coach', 'team_staff', 'parent_referent'].includes(role || '')
}

export function canEvaluatePlayers(role?: string | null) {
  return ['admin', 'coach'].includes(role || '')
}

export function canReadEvaluationSummary(role?: string | null) {
  return ['admin', 'dirigeant', 'coach'].includes(role || '')
}

export function canManageTeamCommunication(role?: string | null) {
  return ['admin', 'dirigeant', 'coach', 'team_staff', 'parent_referent'].includes(role || '')
}

export function canManageMatchLogistics(role?: string | null) {
  return ['admin', 'dirigeant', 'coach', 'team_staff', 'parent_referent'].includes(role || '')
}

export function canManageUsers(role?: string | null) {
  return role === 'admin'
}
