import { supabase } from '../../lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import { mapSessionRowToDomain, mapSituationRowToDomain, type SessionRow, type SessionSituationRow, type SituationRow } from './sessionMapper'

export type SessionReadFilters = { category?: string; theme?: string; status?: string; visibility?: string; teamId?: string }

export class SessionReadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SessionReadError'
  }
}

const sessionProjection = '*, session_situations(*), session_tags(tag)'
const situationProjection = '*, situation_tags(tag)'

type SessionResultRow = SessionRow & { session_situations?: SessionSituationRow[] | null; session_tags?: Array<{ tag: string }> | null }
type SituationResultRow = SituationRow & { situation_tags?: Array<{ tag: string }> | null }

function readError(kind: 'session' | 'situation', error?: { code?: string; message?: string } | null) {
  if (error?.code === 'PGRST116') return new SessionReadError(`${kind === 'session' ? 'Séance' : 'Situation'} introuvable ou inaccessible.`)
  return new SessionReadError(`Impossible de charger ${kind === 'session' ? 'la séance' : 'la situation'}.`)
}

export function createSessionReadService(client: SupabaseClient) {
  return {
    async getSessionById(id: string) {
      const { data, error } = await client.from('sessions').select(sessionProjection).eq('id', id).is('deleted_at', null).maybeSingle()
      if (error) throw readError('session', error)
      if (!data) throw readError('session', { code: 'PGRST116' })
      const row = data as unknown as SessionResultRow
      return mapSessionRowToDomain(row, row.session_situations || [], (row.session_tags || []).map(({ tag }) => tag))
    },
    async listSessions(filters: SessionReadFilters = {}) {
      let query = client.from('sessions').select(sessionProjection).is('deleted_at', null).order('updated_at', { ascending: false })
      if (filters.category) query = query.eq('category', filters.category)
      if (filters.theme) query = query.eq('theme', filters.theme)
      if (filters.status) query = query.eq('status', filters.status)
      if (filters.visibility) query = query.eq('visibility', filters.visibility)
      if (filters.teamId) query = query.eq('team_id', filters.teamId)
      const { data, error } = await query
      if (error) throw readError('session', error)
      return (data as unknown as SessionResultRow[]).map((row) => mapSessionRowToDomain(row, row.session_situations || [], (row.session_tags || []).map(({ tag }) => tag)))
    },
    async getSituationById(id: string) {
      const { data, error } = await client.from('situations').select(situationProjection).eq('id', id).is('deleted_at', null).maybeSingle()
      if (error) throw readError('situation', error)
      if (!data) throw readError('situation', { code: 'PGRST116' })
      return mapSituationRowToDomain(data as unknown as SituationResultRow)
    },
    async listSituations(filters: SessionReadFilters = {}) {
      let query = client.from('situations').select(situationProjection).is('deleted_at', null).order('updated_at', { ascending: false })
      if (filters.category) query = query.eq('category', filters.category)
      if (filters.theme) query = query.eq('theme', filters.theme)
      if (filters.status) query = query.eq('status', filters.status)
      if (filters.visibility) query = query.eq('visibility', filters.visibility)
      if (filters.teamId) query = query.eq('team_id', filters.teamId)
      const { data, error } = await query
      if (error) throw readError('situation', error)
      return (data as unknown as SituationResultRow[]).map(mapSituationRowToDomain)
    },
  }
}

const sessionReadService = createSessionReadService(supabase)
export const getSessionById = sessionReadService.getSessionById
export const listServerSessions = sessionReadService.listSessions
export const getSituationById = sessionReadService.getSituationById
export const listServerSituations = sessionReadService.listSituations

export function situationTags(row: SituationResultRow) {
  return (row.situation_tags || []).map(({ tag }) => tag)
}
