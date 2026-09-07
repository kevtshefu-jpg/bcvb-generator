import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import { mapRosterCapabilities, mapRosterRows } from './rosterMapper'
import { createRosterReadService, mapRosterReadError, RosterReadError } from './rosterReadService'

const capabilityRow = {
  can_view_roster: true,
  can_manage_roster: false,
  can_search_players: false,
  can_create_player: false,
  can_add_membership: false,
  can_deactivate_membership: false,
  can_archive_player: false,
}

const rosterRow = {
  membership_id: 'membership-1', membership_status: 'active', player_id: 'player-1',
  first_name: 'Alice', last_name: 'Martin', player_category: null,
  team_id: 'team-1', team_name: 'Seniors F', team_category: 'Seniors', season: '2026-2027',
}

describe('mapper roster canonique', () => {
  it('mappe exactement les dix champs roster et préserve null', () => {
    expect(mapRosterRows([rosterRow])).toEqual([{
      membershipId: 'membership-1', membershipStatus: 'active', playerId: 'player-1',
      firstName: 'Alice', lastName: 'Martin', playerCategory: null,
      teamId: 'team-1', teamName: 'Seniors F', teamCategory: 'Seniors', season: '2026-2027',
    }])
  })

  it('n’invente aucune valeur absente', () => {
    expect(() => mapRosterRows([{ ...rosterRow, season: undefined }])).toThrow('MALFORMED_ROSTER_RESPONSE')
    expect(() => mapRosterRows([{ ...rosterRow, player_category: undefined }])).toThrow('MALFORMED_ROSTER_RESPONSE')
    expect(() => mapRosterCapabilities([{ ...capabilityRow, can_view_roster: undefined }])).toThrow('MALFORMED_ROSTER_RESPONSE')
  })

  it('mappe les sept capacités serveur sans rôle client', () => {
    expect(mapRosterCapabilities([capabilityRow])).toEqual({
      canViewRoster: true, canManageRoster: false, canSearchPlayers: false,
      canCreatePlayer: false, canAddMembership: false,
      canDeactivateMembership: false, canArchivePlayer: false,
    })
  })
})

describe('service de lecture roster', () => {
  it.each([
    ['42501', 'FORBIDDEN'], ['22023', 'VALIDATION'], ['P0002', 'NOT_FOUND'], ['08006', 'TECHNICAL'],
  ] as const)('mappe %s sans exposer le message serveur', (code, kind) => {
    const error = mapRosterReadError({ code, message: 'raw SQL secret' })
    expect(error).toBeInstanceOf(RosterReadError)
    expect(error.kind).toBe(kind)
    expect(error.message).not.toContain('raw SQL')
  })

  it('utilise uniquement les deux RPC read-only et include_inactive=false', async () => {
    const calls: Array<{ name: string; args: object }> = []
    const client = {
      rpc: async (name: string, args: object) => {
        calls.push({ name, args })
        return name === 'get_roster_capabilities'
          ? { data: [capabilityRow], error: null }
          : { data: [rosterRow], error: null }
      },
    } as unknown as SupabaseClient
    const service = createRosterReadService(client)
    await service.getCapabilities('team-1')
    await service.readTeamRoster('team-1')
    expect(calls).toEqual([
      { name: 'get_roster_capabilities', args: { target_team_id: 'team-1' } },
      { name: 'read_team_roster', args: { target_team_id: 'team-1', include_inactive: false } },
    ])
  })

  it('classe une réponse malformée sans exposer son contenu', async () => {
    const client = { rpc: async () => ({ data: [{ can_view_roster: true }], error: null }) } as unknown as SupabaseClient
    await expect(createRosterReadService(client).getCapabilities('team-1')).rejects.toMatchObject({ kind: 'MALFORMED' })
  })
})

describe('garde statique M4.2', () => {
  it('n’accède à aucune table sensible et n’appelle aucune RPC de mutation', () => {
    const paths = [
      'src/features/roster/rosterModels.ts', 'src/features/roster/rosterMapper.ts',
      'src/features/roster/rosterReadService.ts', 'src/features/roster/pages/RosterPage.tsx',
      'src/features/roster/components/RosterTeamSelector.tsx', 'src/features/roster/components/RosterList.tsx',
      'src/features/roster/components/RosterStatePanel.tsx',
    ]
    const source = paths.map((path) => readFileSync(resolve(process.cwd(), path), 'utf8')).join('\n')
    for (const forbidden of [
      ".from('players')", '.from("players")', ".from('team_memberships')", '.from("team_memberships")',
      ".from('player_contacts')", '.from("player_contacts")', 'create_player_for_roster',
      'search_players_for_roster', 'add_or_reactivate_team_membership', 'deactivate_team_membership',
      'create_team_season', 'import_rf3_pilot_2026_2027', 'rosterPermissions', 'getRosterPermissions',
      'localStorage', 'sessionStorage',
    ]) expect(source).not.toContain(forbidden)
    expect(source).not.toMatch(/\.(insert|update|delete|upsert)\s*\(/)
  })

  it('met les cinq routes historiques hors de portée de l’atelier legacy', () => {
    const router = readFileSync(resolve(process.cwd(), 'src/app/router.tsx'), 'utf8')
    const entry = readFileSync(resolve(process.cwd(), 'src/pages/RosterImportPage.tsx'), 'utf8')
    expect(entry).toContain("../features/roster/pages/RosterPage")
    expect(entry).not.toContain('../components/roster/RosterPage')
    for (const route of ['effectifs/import', 'parents-referents/effectifs', 'club/effectifs', 'admin/import-joueurs']) {
      const start = router.indexOf(`path: '${route}'`)
      expect(router.slice(start, start + 150)).toContain('<Navigate to="/effectifs" replace />')
    }
  })
})
