import { describe, expect, it } from 'vitest'
import {
  canAccessClubDashboard,
  canCreateTrainingSession,
  canEvaluatePlayers,
  canManageAttendance,
  canManageUsers,
  canAccessLibrary,
  isAdmin,
  isCoach,
  isDirigeant,
  normalizeRole,
} from './roles'

describe('matrice des rôles front', () => {
  it('normalise les rôles historiques', () => {
    expect(normalizeRole('technical_manager')).toBe('responsable_technique')
    expect(normalizeRole('membre')).toBe('member')
    expect(normalizeRole(null)).toBe('member')
  })

  it('réserve la gestion des utilisateurs aux rôles élevés', () => {
    expect(canManageUsers('admin')).toBe(true)
    expect(canManageUsers('responsable_technique')).toBe(true)
    expect(canManageUsers('dirigeant')).toBe(false)
    expect(canManageUsers('coach')).toBe(false)
    expect(canManageUsers('member')).toBe(false)
  })

  it('autorise les fonctions sportives selon la matrice attendue', () => {
    expect(canCreateTrainingSession('coach')).toBe(true)
    expect(canEvaluatePlayers('coach')).toBe(true)
    expect(canManageAttendance('team_staff')).toBe(true)
    expect(canCreateTrainingSession('member')).toBe(false)
    expect(canEvaluatePlayers('dirigeant')).toBe(false)
  })

  it('accorde au dirigeant la lecture club sans rôle admin', () => {
    expect(isDirigeant('dirigeant')).toBe(true)
    expect(canAccessClubDashboard('dirigeant')).toBe(true)
    expect(isAdmin('dirigeant')).toBe(false)
    expect(isCoach('dirigeant')).toBe(false)
  })

  it('refuse les permissions quand le rôle est absent ou inconnu', () => {
    expect(canAccessLibrary(null)).toBe(false)
    expect(canAccessLibrary(undefined)).toBe(false)
    expect(canAccessLibrary('role_inconnu')).toBe(false)
    expect(canManageUsers('role_inconnu')).toBe(false)
  })
})
