import type { SupabaseClient } from '@supabase/supabase-js'

import { supabase } from '../../../lib/supabase'

const RF3_LICENSES = [
  'VT052472',
  'VT986831',
  'VT026946',
  'VT054548',
  'VT050954',
  'VT025564',
  'VT031276',
] as const

export type Rf3PilotPrecheck = {
  teams: number
  players: number
  memberships: number
  staff: number
  kevinCandidates: number
  state: 'ready' | 'initialized' | 'inconsistent'
}

export type Rf3PilotImportResult = {
  status: 'IMPORTED' | 'ALREADY_IMPORTED'
  team_created: number
  team_reused: number
  players_created: number
  players_reused: number
  memberships_created: number
  memberships_reused: number
  staff_created: number
  staff_reused: number
}

type TeamRow = { id: string; head_coach_id: string | null; archived_at: string | null }
type PlayerRow = { id: string; license_number: string }
type MembershipRow = { player_id: string; team_id: string; season: string; status: string }
type StaffRow = { team_id: string; profile_id: string; assignment_role: string; is_active: boolean }
type ProfileRow = { id: string }

function ensureNoError(error: { message: string } | null, message: string) {
  if (error) throw new Error(message)
}

export function createRf3PilotImportService(client: SupabaseClient) {
  async function precheck(): Promise<Rf3PilotPrecheck> {
    const [teamsResponse, playersResponse, kevinResponse] = await Promise.all([
      client
        .from('teams')
        .select('id, head_coach_id, archived_at')
        .ilike('name', 'RF3 - SF')
        .eq('category', 'Seniors')
        .eq('level', 'RF3')
        .eq('season', '2026-2027'),
      client.from('players').select('id, license_number').in('license_number', [...RF3_LICENSES]),
      client
        .from('profiles')
        .select('id')
        .ilike('full_name', 'Kevin TSHEFU')
        .eq('is_active', true)
        .eq('profile_status', 'active'),
    ])

    ensureNoError(teamsResponse.error, 'Précheck RF3 indisponible.')
    ensureNoError(playersResponse.error, 'Précheck RF3 indisponible.')
    ensureNoError(kevinResponse.error, 'Précheck RF3 indisponible.')

    const teams = (teamsResponse.data || []) as TeamRow[]
    const players = (playersResponse.data || []) as PlayerRow[]
    const playerIds = players.map((player) => player.id)
    const teamIds = teams.map((team) => team.id)

    const [membershipsResponse, staffResponse] = await Promise.all([
      teamIds.length && playerIds.length
        ? client
            .from('team_memberships')
            .select('player_id, team_id, season, status')
            .in('team_id', teamIds)
            .in('player_id', playerIds)
        : Promise.resolve({ data: [] as MembershipRow[], error: null }),
      teamIds.length
        ? client
            .from('team_staff_assignments')
            .select('team_id, profile_id, assignment_role, is_active')
            .in('team_id', teamIds)
            .eq('assignment_role', 'head_coach')
            .eq('is_active', true)
        : Promise.resolve({ data: [] as StaffRow[], error: null }),
    ])

    ensureNoError(membershipsResponse.error, 'Précheck RF3 indisponible.')
    ensureNoError(staffResponse.error, 'Précheck RF3 indisponible.')

    const memberships = (membershipsResponse.data || []) as MembershipRow[]
    const staff = (staffResponse.data || []) as StaffRow[]
    const kevinCandidates = (kevinResponse.data || []) as ProfileRow[]
    const licenseCounts = new Map<string, number>()
    for (const player of players) {
      const license = player.license_number.trim().toUpperCase()
      licenseCounts.set(license, (licenseCounts.get(license) || 0) + 1)
    }
    const everyLicenseUnique = RF3_LICENSES.every((license) => licenseCounts.get(license) === 1)
    const everyMembershipValid = playerIds.every((playerId) => memberships.filter((membership) => (
      membership.player_id === playerId &&
      membership.team_id === teams[0]?.id &&
      membership.season === '2026-2027' &&
      membership.status === 'active'
    )).length === 1)
    const validHeadCoach = Boolean(
      teams.length === 1 &&
      teams[0].archived_at === null &&
      kevinCandidates.length === 1 &&
      teams[0].head_coach_id === kevinCandidates[0].id &&
      staff.length === 1 &&
      staff[0].team_id === teams[0].id &&
      staff[0].profile_id === kevinCandidates[0].id,
    )

    const counts = {
      teams: teams.length,
      players: players.length,
      memberships: memberships.length,
      staff: staff.length,
      kevinCandidates: kevinCandidates.length,
    }
    const ready = counts.teams === 0 && counts.players === 0 && counts.memberships === 0 && counts.staff === 0 && counts.kevinCandidates === 1
    const initialized = counts.teams === 1 && counts.players === 7 && everyLicenseUnique && counts.memberships === 7 && everyMembershipValid && counts.staff === 1 && validHeadCoach

    return { ...counts, state: ready ? 'ready' : initialized ? 'initialized' : 'inconsistent' }
  }

  async function importPilot(): Promise<Rf3PilotImportResult> {
    const { data, error } = await client.rpc('import_rf3_pilot_2026_2027')
    if (error) throw new Error('L’import RF3 a échoué. Aucun nouvel essai automatique n’a été effectué.')
    return data as Rf3PilotImportResult
  }

  return { precheck, importPilot }
}

export const rf3PilotImportService = createRf3PilotImportService(supabase)
