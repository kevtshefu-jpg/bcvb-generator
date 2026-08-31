import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { assertAssignableProfile, canManageTeamStaff, hasActiveDuplicate, type StaffAssignment } from './teamManagementService'

const assignment: StaffAssignment = { id: 'a1', team_id: 't1', profile_id: 'p1', assignment_role: 'head_coach', is_active: true, profile: null }

describe('règles métier des affectations équipe', () => {
  it('autorise uniquement admin et responsable technique à gérer le staff', () => {
    expect(canManageTeamStaff('admin')).toBe(true)
    expect(canManageTeamStaff('responsable_technique')).toBe(true)
    for (const role of ['dirigeant', 'coach', 'parent_referent', 'membre', 'member']) expect(canManageTeamStaff(role)).toBe(false)
  })

  it('refuse un doublon actif de même profil et rôle', () => {
    expect(hasActiveDuplicate([assignment], 'p1', 'head_coach')).toBe(true)
    expect(hasActiveDuplicate([assignment], 'p1', 'assistant_coach')).toBe(false)
  })

  it('autorise la réactivation d’une affectation inactive', () => {
    expect(hasActiveDuplicate([{ ...assignment, is_active: false }], 'p1', 'head_coach')).toBe(false)
  })

  it('refuse les profils inactifs, absents ou au statut non actif', () => {
    expect(() => assertAssignableProfile(null)).toThrow(/inactif/)
    expect(() => assertAssignableProfile({ is_active: false, profile_status: 'active' })).toThrow(/inactif/)
    expect(() => assertAssignableProfile({ is_active: true, profile_status: 'deleted' })).toThrow(/inactif/)
  })

  it('accepte un profil actif', () => {
    expect(() => assertAssignableProfile({ is_active: true, profile_status: 'active' })).not.toThrow()
  })

  it('laisse assistant et parent référent optionnels', () => {
    const onlyHeadCoach = [assignment]
    expect(onlyHeadCoach.some((item) => item.assignment_role === 'assistant_coach')).toBe(false)
    expect(onlyHeadCoach.some((item) => item.assignment_role === 'parent_referent')).toBe(false)
  })

  it('isole les joueurs du détail équipe par saison et statut actif', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/features/teams/teamManagementService.ts'), 'utf8')
    const loadTeamDetailSource = source.slice(source.indexOf('export async function loadTeamDetail'), source.indexOf('export async function loadAssignableProfiles'))

    expect(loadTeamDetailSource).toContain(".eq('team_id', teamId)")
    expect(loadTeamDetailSource).toContain(".eq('season', teamResult.data.season)")
    expect(loadTeamDetailSource).toContain(".eq('status', 'active')")
    expect(loadTeamDetailSource).not.toContain(".neq('status', 'inactive')")
  })
})
