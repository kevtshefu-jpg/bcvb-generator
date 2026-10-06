import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import type { PlayerEvaluation } from '../../types/evaluations'

type UnknownRecord = Record<string, unknown>
function isRecord(value: unknown): value is UnknownRecord { return typeof value === 'object' && value !== null && !Array.isArray(value) }
function requiredString(row: UnknownRecord, key: string) {
  const value = row[key]
  if (typeof value !== 'string' || !value) throw new Error('MALFORMED_PLAYER_EVALUATION_RESPONSE')
  return value
}

export function mapStoredEvaluation(value: unknown): PlayerEvaluation {
  if (!isRecord(value) || !isRecord(value.content_json)) throw new Error('MALFORMED_PLAYER_EVALUATION_RESPONSE')
  const content = value.content_json as UnknownRecord
  const scores = Array.isArray(content.scores) ? content.scores : []
  return {
    ...(content as unknown as PlayerEvaluation),
    id: requiredString(value, 'evaluation_id'),
    playerId: requiredString(value, 'player_id'),
    teamId: requiredString(value, 'team_id'),
    season: requiredString(value, 'season'),
    period: requiredString(value, 'period') as PlayerEvaluation['period'],
    category: requiredString(value, 'category'),
    date: requiredString(value, 'evaluation_date'),
    createdBy: requiredString(value, 'created_by'),
    createdAt: requiredString(value, 'created_at'),
    updatedAt: requiredString(value, 'updated_at'),
    scores,
  }
}

export function createPlayerEvaluationService(client: SupabaseClient) {
  return {
    async readPlayer(playerId: string, teamId: string): Promise<PlayerEvaluation[]> {
      const { data, error } = await client.rpc('read_player_evaluations', { target_player_id: playerId, target_team_id: teamId })
      if (error) throw error
      return (Array.isArray(data) ? data : []).map(mapStoredEvaluation)
    },
    async save(evaluation: PlayerEvaluation): Promise<string> {
      const content = {
        criteria: evaluation.criteria ?? [],
        scores: evaluation.scores,
        strengths: evaluation.strengths,
        priorities: evaluation.priorities,
        priorityAxis: evaluation.priorityAxis ?? '',
        monthlyChallenge: evaluation.monthlyChallenge ?? '',
        nextStep: evaluation.nextStep ?? '',
        globalComment: evaluation.globalComment ?? '',
        coachComment: evaluation.coachComment,
        playerFeedback: evaluation.playerFeedback ?? '',
        parentFeedback: evaluation.parentFeedback ?? '',
        individualObjective: evaluation.individualObjective ?? null,
        visibleToPlayer: Boolean(evaluation.visibleToPlayer),
        visibleToFamily: Boolean(evaluation.visibleToFamily),
      }
      const { data, error } = await client.rpc('save_player_evaluation', {
        target_player_id: evaluation.playerId,
        target_team_id: evaluation.teamId,
        target_season: evaluation.season,
        target_period: evaluation.period,
        target_category: evaluation.category,
        target_evaluation_date: evaluation.date || new Date().toISOString().slice(0, 10),
        target_content_json: content,
      })
      if (error) throw error
      if (typeof data !== 'string' || !data) throw new Error('PLAYER_EVALUATION_SAVE_NOT_CONFIRMED')
      return data
    },
  }
}

export const playerEvaluationService = createPlayerEvaluationService(supabase)
