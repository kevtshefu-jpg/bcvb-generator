import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildTechnicalDashboardModel } from './technicalDashboardCalculations'
import { canViewTechnicalDashboard, getTechnicalDashboardRole } from './technicalDashboardAccess'
import type { TechnicalDashboardSource } from './types'

const source: TechnicalDashboardSource = {
  teams: [
    { id: 'team-a', name: 'U13 A', category: 'U13', level: 'Région', season: '2026', head_coach_id: null, assistant_coach_ids: [] },
    { id: 'team-b', name: 'U15 F', category: 'U15', level: 'Département', season: '2026', head_coach_id: 'coach-2', assistant_coach_ids: ['coach-3'] },
  ],
  staffAssignments: [
    { team_id: 'team-b', profile_id: 'coach-2', assignment_role: 'head_coach', is_active: true },
    { team_id: 'team-b', profile_id: 'coach-3', assignment_role: 'assistant_coach', is_active: true },
    { team_id: 'team-b', profile_id: 'parent-1', assignment_role: 'parent_referent', is_active: true },
  ],
  profiles: [
    { id: 'coach-2', full_name: 'Alice Coach', email: 'alice@bcvb.test', role: 'coach' },
    { id: 'coach-3', full_name: 'Bruno Adjoint', email: 'bruno@bcvb.test', role: 'coach' },
    { id: 'parent-1', full_name: 'Camille Parent', email: 'camille@bcvb.test', role: 'parent_referent' },
  ],
  pendingRegistrations: 2,
  pendingProfileRequests: 1,
  unreadAdminNotifications: 0,
  trainingSlots: [],
}

describe('calculs du tableau technique', () => {
  it('détecte une équipe sans coach principal et compte les demandes pending', () => {
    const model = buildTechnicalDashboardModel(source)
    expect(model.teamCount).toBe(2)
    expect(model.teamsWithoutHeadCoach).toBe(1)
    expect(model.alerts.find((item) => item.id === 'registrations')?.count).toBe(2)
    expect(model.alerts.find((item) => item.id === 'profiles')?.count).toBe(1)
    expect(model.alerts.some((item) => item.id === 'staff-incomplete')).toBe(false)
    expect(model.teams[0].hasAssistantCoach).toBe(false)
    expect(model.teams[0].hasParentReferent).toBe(false)
  })

  it('ne transforme pas les données masquées du dirigeant en zéros', () => {
    const model = buildTechnicalDashboardModel({ ...source, staffAssignments: null, profiles: null, pendingRegistrations: null, pendingProfileRequests: null, unreadAdminNotifications: null })
    expect(model.assignedCoachCount).toBeNull()
    expect(model.alerts.some((item) => item.id === 'registrations')).toBe(false)
  })

  it('utilise la même date locale que le formulaire autour de minuit', () => {
    const model = buildTechnicalDashboardModel({
      ...source,
      trainingSlots: [{ id: 'slot-1', team_id: 'team-a', weekday: 1, start_time: '18:00', end_time: '19:00', location_name: 'Salle A', valid_from: '2026-08-17', valid_until: null, is_active: true }],
    }, new Date('2026-08-16T22:30:00.000Z'), 'Europe/Paris')

    expect(model.schedule[0].isToday).toBe(true)
    expect(model.teamsWithoutActiveSlot).toBe(1)
  })

  it('autorise DT, RT, admin et dirigeant, mais refuse un coach', () => {
    expect(canViewTechnicalDashboard('responsable_technique')).toBe(true)
    expect(canViewTechnicalDashboard('technical_manager')).toBe(true)
    expect(canViewTechnicalDashboard('admin')).toBe(true)
    expect(canViewTechnicalDashboard('dirigeant')).toBe(true)
    expect(canViewTechnicalDashboard('coach')).toBe(false)
  })

  it('donne exactement le rôle canonique responsable technique à technical_manager', () => {
    expect(getTechnicalDashboardRole('technical_manager')).toBe('responsable_technique')
    expect(getTechnicalDashboardRole('technical_manager')).toBe(getTechnicalDashboardRole('responsable_technique'))
  })

  it('reste en cartes mobiles sans table compressée ni donnée simulée', async () => {
    const [component, css, service] = await Promise.all([
      readFile(resolve(process.cwd(), 'src/features/technical-dashboard/TechnicalDashboard.tsx'), 'utf8'),
      readFile(resolve(process.cwd(), 'src/features/technical-dashboard/TechnicalDashboard.css'), 'utf8'),
      readFile(resolve(process.cwd(), 'src/features/technical-dashboard/technicalDashboardService.ts'), 'utf8'),
    ])
    expect(component).not.toMatch(/<table/i)
    expect(css).toContain('@media(max-width:600px)')
    expect(css).toContain('min-height:44px')
    expect(service).toContain("supabase.from('teams')")
    expect(service).toContain("supabase.from('team_staff_assignments')")
    expect(service).toContain("supabase.from('training_slots')")
    expect(service).not.toContain('getMockAnnualPlannings')
    expect(service).not.toMatch(/localStorage|mock|fixture/i)
  })
})
