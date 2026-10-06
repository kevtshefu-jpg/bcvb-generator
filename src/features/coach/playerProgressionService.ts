import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'

export type PlayerProgressionProfile = {
  playerId: string
  firstName: string
  lastName: string
  category: string | null
  teamId: string
  teamName: string
  teamCategory: string
  season: string
  attendanceStatus: string | null
  evaluationStatus: string | null
  objectivesStatus: string | null
  documentsStatus: string | null
  evaluationCount: number
  activeObjectiveCount: number
  lastEvaluationDate: string | null
  summary: Record<string, unknown>
}

type UnknownRecord = Record<string, unknown>
function isRecord(value: unknown): value is UnknownRecord { return typeof value === 'object' && value !== null && !Array.isArray(value) }
function requiredString(row: UnknownRecord, field: string): string {
  const value = row[field]
  if (typeof value !== 'string' || value.length === 0) throw new Error('MALFORMED_PLAYER_PROGRESSION_RESPONSE')
  return value
}
function requiredNumber(row: UnknownRecord, field: string): number {
  const value = row[field]
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('MALFORMED_PLAYER_PROGRESSION_RESPONSE')
  return value
}
function optionalString(row: UnknownRecord, field: string): string | null {
  const value = row[field]
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') throw new Error('MALFORMED_PLAYER_PROGRESSION_RESPONSE')
  return value
}

export function mapPlayerProgressionProfile(value: unknown): PlayerProgressionProfile {
  if (!isRecord(value)) throw new Error('MALFORMED_PLAYER_PROGRESSION_RESPONSE')
  const summary = value.summary_json
  if (summary !== null && summary !== undefined && !isRecord(summary)) throw new Error('MALFORMED_PLAYER_PROGRESSION_RESPONSE')
  return {
    playerId: requiredString(value, 'player_id'), firstName: requiredString(value, 'first_name'),
    lastName: requiredString(value, 'last_name'), category: optionalString(value, 'player_category'),
    teamId: requiredString(value, 'team_id'), teamName: requiredString(value, 'team_name'),
    teamCategory: requiredString(value, 'team_category'), season: requiredString(value, 'season'),
    attendanceStatus: optionalString(value, 'attendance_status'), evaluationStatus: optionalString(value, 'evaluation_status'),
    objectivesStatus: optionalString(value, 'objectives_status'), documentsStatus: optionalString(value, 'documents_status'),
    evaluationCount: requiredNumber(value, 'evaluation_count'), activeObjectiveCount: requiredNumber(value, 'active_objective_count'),
    lastEvaluationDate: optionalString(value, 'last_evaluation_date'),
    summary: (summary as Record<string, unknown> | null | undefined) ?? {},
  }
}

export function createPlayerProgressionService(client: SupabaseClient) {
  return { async readProfile(playerId: string): Promise<PlayerProgressionProfile> {
    const { data, error } = await client.rpc('read_player_progression_profile', { target_player_id: playerId })
    if (error) throw error
    const rows = Array.isArray(data) ? data : []
    if (rows.length !== 1) throw new Error('PLAYER_PROGRESSION_NOT_FOUND')
    return mapPlayerProgressionProfile(rows[0])
  } }
}
export const playerProgressionService = createPlayerProgressionService(supabase)
export type PlayerProgressionService = ReturnType<typeof createPlayerProgressionService>
