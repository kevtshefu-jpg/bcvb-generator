import { describe, expect, it, vi } from 'vitest'
import { createPlayerProgressionService, mapPlayerProgressionProfile } from './playerProgressionService'

describe('playerProgressionService', () => {
  const row = {
    player_id: 'player-1', first_name: 'Ada', last_name: 'Lovelace', player_category: 'Seniors',
    team_id: 'team-1', team_name: 'SF1', team_category: 'Seniors', season: '2026-2027',
    attendance_status: 'ready', evaluation_status: 'ready', objectives_status: 'to_link',
    documents_status: 'to_link', summary_json: { source: 'canonical' },
  }

  it('mappe strictement le profil canonique', () => {
    expect(mapPlayerProgressionProfile(row)).toMatchObject({
      playerId: 'player-1', firstName: 'Ada', lastName: 'Lovelace', teamId: 'team-1',
      season: '2026-2027', summary: { source: 'canonical' },
    })
  })

  it('refuse une réponse mal formée', () => {
    expect(() => mapPlayerProgressionProfile({ ...row, player_id: null })).toThrow('MALFORMED_PLAYER_PROGRESSION_RESPONSE')
  })

  it('utilise uniquement la RPC de lecture dédiée', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [row], error: null })
    const service = createPlayerProgressionService({ rpc } as never)
    await expect(service.readProfile('player-1')).resolves.toMatchObject({ playerId: 'player-1' })
    expect(rpc).toHaveBeenCalledWith('read_player_progression_profile', { target_player_id: 'player-1' })
  })
})
