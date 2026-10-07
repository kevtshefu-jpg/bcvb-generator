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
  it('ne duplique pas l’objectif canonique dans le JSON d’évaluation', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 'eval-1', error: null })
    const service = createPlayerEvaluationService({ rpc } as never)
    await service.save({
      id: 'draft', playerId: 'player-1', teamId: 'team-1', category: 'U15', period: 'trimestre_1',
      season: '2026-2027', createdBy: 'coach-1', scores: [], strengths: [], priorities: [], coachComment: '',
      individualObjective: { id: 'objective-draft', playerId: 'player-1', title: 'Premier pas', domain: 'physique',
        targetDescription: 'Créer un avantage', observableCriterion: 'Déborder', status: 'en_cours' },
      createdAt: '2026-10-07T00:00:00Z', updatedAt: '2026-10-07T00:00:00Z',
    })
    const payload = rpc.mock.calls[0][1].target_content_json
    expect(payload).not.toHaveProperty('individualObjective')
  })

  it('lit uniquement via la RPC dédiée', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [row], error: null })
    const service = createPlayerEvaluationService({ rpc } as never)
    await expect(service.readPlayer('player-1', 'team-1')).resolves.toHaveLength(1)
    expect(rpc).toHaveBeenCalledWith('read_player_evaluations', { target_player_id: 'player-1', target_team_id: 'team-1' })
  })
})
