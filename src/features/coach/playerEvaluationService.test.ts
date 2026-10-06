import { describe, expect, it, vi } from 'vitest'
import { createPlayerEvaluationService, mapStoredEvaluation } from './playerEvaluationService'

const row = {
  evaluation_id: 'eval-1', player_id: 'player-1', team_id: 'team-1', season: '2026-2027',
  period: 'trimestre_1', category: 'U15', evaluation_date: '2026-10-07',
  created_by: 'coach-1', created_at: '2026-10-07T00:00:00Z', updated_at: '2026-10-07T00:00:00Z',
  content_json: { scores: [], strengths: [], priorities: [], coachComment: '' },
}

describe('playerEvaluationService', () => {
  it('mappe une évaluation serveur sur son identité canonique', () => {
    expect(mapStoredEvaluation(row)).toMatchObject({ id: 'eval-1', playerId: 'player-1', teamId: 'team-1', period: 'trimestre_1' })
  })
  it('refuse une réponse sans contenu structuré', () => {
    expect(() => mapStoredEvaluation({ ...row, content_json: null })).toThrow('MALFORMED_PLAYER_EVALUATION_RESPONSE')
  })
  it('lit uniquement via la RPC dédiée', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [row], error: null })
    const service = createPlayerEvaluationService({ rpc } as never)
    await expect(service.readPlayer('player-1', 'team-1')).resolves.toHaveLength(1)
    expect(rpc).toHaveBeenCalledWith('read_player_evaluations', { target_player_id: 'player-1', target_team_id: 'team-1' })
  })
})
